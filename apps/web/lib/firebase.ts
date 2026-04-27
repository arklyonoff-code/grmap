"use client";

import { initializeApp, getApps } from "firebase/app";
import { get, getDatabase, onValue, orderByChild, push, query, ref as dbRef, startAt } from "firebase/database";
import { WaitLevel, WaitReport, VehicleSize, Zone } from "@grmap/shared/types";
import { buildReportExpiry } from "@grmap/shared/utils/report";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasFirebaseEnv(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.databaseURL &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );
}

const app = hasFirebaseEnv()
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

const db = app ? getDatabase(app) : null;

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "web-unknown";
  const existing = window.localStorage.getItem("grmap_device_id");
  if (existing) return existing;
  const nextId = crypto.randomUUID();
  window.localStorage.setItem("grmap_device_id", nextId);
  return nextId;
}

export async function fetchZonesFromFirebase(): Promise<Zone[]> {
  if (!db) return [];
  const snapshot = await get(dbRef(db, "/zones"));
  const raw = snapshot.val() ?? {};
  return Object.entries(raw).map(([id, value]) => ({ id, ...(value as Omit<Zone, "id">) }));
}

export async function fetchActiveReportsFromFirebase(): Promise<WaitReport[]> {
  if (!db) return [];
  const snapshot = await get(dbRef(db, "/wait_reports"));
  const raw = snapshot.val() ?? {};
  const now = Date.now();
  return Object.entries(raw)
    .map(([id, value]) => ({ id, ...(value as Omit<WaitReport, "id">) }))
    .filter(
      (report) =>
        typeof report.expiresAt === "number" &&
        report.expiresAt > now &&
        report.status !== "hidden"
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function subscribeActiveReports(
  callback: (reports: WaitReport[]) => void
): () => void {
  if (!db) {
    callback([]);
    return () => {};
  }
  const ref = dbRef(db, "wait_reports");
  const q = query(ref, orderByChild("expiresAt"), startAt(Date.now()));
  return onValue(q, (snap) => {
    const reports: WaitReport[] = [];
    snap.forEach((child) => {
      const report = child.val() as Omit<WaitReport, "id">;
      if (report.status !== "hidden") {
        reports.push({ ...report, id: child.key ?? "" });
      }
    });
    callback(reports.sort((a, b) => b.createdAt - a.createdAt));
  });
}

export async function submitWebReport(input: {
  zoneId: string;
  waitLevel: WaitLevel;
  vehicleSize: VehicleSize | null;
  message?: string;
}): Promise<boolean> {
  if (!db) return false;
  const deviceId = getOrCreateDeviceId();
  const now = Date.now();

  await push(dbRef(db, "/wait_reports"), {
    zoneId: input.zoneId,
    waitLevel: input.waitLevel,
    vehicleSize: input.vehicleSize,
    message: input.message || null,
    deviceId,
    platform: "web",
    status: "active",
    createdAt: now,
    expiresAt: buildReportExpiry(),
    upvotes: 0,
  });
  return true;
}
