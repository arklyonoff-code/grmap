import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  get,
  getDatabase,
  off,
  onValue,
  push,
  ref,
  serverTimestamp,
} from 'firebase/database';
import { WaitLevel, VehicleSize, WaitReport, Zone } from '@grmap/shared/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'MISSING_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'MISSING_AUTH_DOMAIN',
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://example.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'MISSING_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'MISSING_BUCKET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'MISSING_SENDER',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'MISSING_APP_ID',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const authInstance = getAuth(app);

const db = getDatabase(app);
let cachedZones: Zone[] | null = null;

async function ensureAnonymousUser(): Promise<User> {
  const current = authInstance.currentUser;
  if (current) return current;

  return new Promise<User>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
        return;
      }
      try {
        await signInAnonymously(authInstance);
      } catch (error) {
        unsubscribe();
        reject(error);
      }
    });
  });
}

export async function getDeviceId(): Promise<string> {
  const user = await ensureAnonymousUser();
  return user.uid;
}

export function subscribeActiveReports(
  callback: (reports: WaitReport[]) => void
): () => void {
  const reportsRef = ref(db, '/wait_reports');

  const listener = onValue(reportsRef, (snapshot) => {
    const rawValue = snapshot.val() ?? {};
    const now = Date.now();
    const activeReports: WaitReport[] = Object.entries(rawValue)
      .map(([id, value]) => ({ id, ...(value as Omit<WaitReport, 'id'>) }))
      .filter(
        (report) =>
          typeof report.expiresAt === 'number' &&
          report.expiresAt > now &&
          report.status !== 'hidden'
      )
      .sort((a, b) => b.createdAt - a.createdAt);
    callback(activeReports);
  });

  return () => {
    off(reportsRef, 'value', listener);
  };
}

export async function submitWaitReport(
  zoneId: string,
  waitLevel: WaitLevel,
  vehicleSize: VehicleSize | null
): Promise<void> {
  const deviceId = await getDeviceId();
  const now = Date.now();
  const expiresAt = now + 45 * 60 * 1000;

  await push(ref(db, '/wait_reports'), {
    zoneId,
    waitLevel,
    vehicleSize,
    message: null,
    deviceId,
    platform: 'app',
    status: 'active',
    createdAt: now,
    createdAtServer: serverTimestamp(),
    expiresAt,
    upvotes: 0,
  });
}

export async function fetchZones(): Promise<Zone[]> {
  if (cachedZones) return cachedZones;
  const snapshot = await get(ref(db, '/zones'));
  const data = snapshot.val() ?? {};
  const zones = Object.entries(data).map(([id, value]) => ({
    id,
    ...(value as Omit<Zone, 'id'>),
  }));
  cachedZones = zones;
  return zones;
}
