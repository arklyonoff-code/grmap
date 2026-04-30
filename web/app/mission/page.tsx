"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BADGES } from "@grmap/shared/constants/mission";
import type { MissionStamp, TodayMissions } from "@grmap/shared/types";
import {
  completeMission,
  fetchMyMissionStamp,
  fetchWeeklyRanking,
  getOrCreateDeviceId,
  handleCheckin,
  loadTodayMissions,
} from "@/services/mission";

type MissionCardProps = {
  icon: string;
  title: string;
  desc: string;
  reward: number;
  done: boolean;
  onClick: () => void;
};

function MissionCard({ icon, title, desc, reward, done, onClick }: MissionCardProps) {
  return (
    <div
      onClick={done ? undefined : onClick}
      style={{
        margin: "10px 16px 0",
        padding: "16px",
        background: "#fff",
        borderRadius: 14,
        border: done ? "1.5px solid #1D9E75" : "0.5px solid #EEEEEE",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: done ? "default" : "pointer",
        opacity: done ? 0.75 : 1,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          background: done ? "#E1F5EE" : "#F5F4F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {done ? "✅" : icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            textDecoration: done ? "line-through" : "none",
            color: done ? "#999" : "#111",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{desc}</div>
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: done ? "#1D9E75" : "#EF9F27",
          background: done ? "#E1F5EE" : "#FEF9EC",
          padding: "4px 10px",
          borderRadius: 99,
        }}
      >
        {done ? "완료" : `+${reward}🪙`}
      </div>
    </div>
  );
}

export default function MissionPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<TodayMissions>({
    checkin: false,
    waittime: false,
    price: false,
    date: "",
  });
  const [deviceId, setDeviceId] = useState("");
  const [nickname, setNickname] = useState("익명");
  const [totalStamps, setTotalStamps] = useState(0);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [rankings, setRankings] = useState<MissionStamp[]>([]);

  useEffect(() => {
    const id = getOrCreateDeviceId();
    const nick = localStorage.getItem("grmap_nickname") || "익명";
    setDeviceId(id);
    setNickname(nick);
    setMissions(loadTodayMissions());
    fetchMyMissionStamp(id)
      .then((mine) => {
        setTotalStamps(mine.totalStamps);
        setConsecutiveDays(mine.consecutiveDays);
        setBadges(mine.badges);
      })
      .catch(() => undefined);
    fetchWeeklyRanking()
      .then(setRankings)
      .catch(() => setRankings([]));
  }, []);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    []
  );

  return (
    <main className="feed-page" style={{ paddingBottom: 24 }}>
      <div style={{ padding: "20px 16px 0" }}>
        <p style={{ fontSize: 12, color: "#999" }}>{dateLabel}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>오늘 미션</h1>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {totalStamps}
              <span style={{ fontSize: 14, fontWeight: 400, color: "#999" }}> 스탬프</span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          margin: "16px 16px 0",
          padding: "14px 16px",
          background: consecutiveDays >= 3 ? "#FEF9EC" : "#F8F8F8",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 28 }}>{consecutiveDays === 0 ? "📅" : consecutiveDays >= 7 ? "🔥" : "✅"}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {consecutiveDays === 0 ? "오늘 첫 체크인 해보세요" : `${consecutiveDays}일 연속 출석 중!`}
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
            {consecutiveDays >= 7
              ? "🏆 7일 개근 달성!"
              : `7일 연속이면 ⭐ 뱃지 획득 (${Math.max(0, 7 - consecutiveDays)}일 남음)`}
          </div>
        </div>
      </div>

      <MissionCard
        icon="📍"
        title="현장 체크인"
        desc="가락시장 근처에서 위치 인증"
        reward={3}
        done={missions.checkin}
        onClick={async () => {
          const result = await handleCheckin(deviceId, nickname);
          alert(result.message);
          if (!result.success) return;
          setMissions((prev) => ({ ...prev, checkin: true }));
          setTotalStamps((prev) => prev + 3);
          setConsecutiveDays((prev) => (prev > 0 ? prev + 1 : 1));
          const latest = await fetchMyMissionStamp(deviceId);
          setConsecutiveDays(latest.consecutiveDays);
          setBadges(latest.badges);
          const weekly = await fetchWeeklyRanking();
          setRankings(weekly);
        }}
      />
      <MissionCard
        icon="🚛"
        title="대기시간 공유"
        desc="현재 구역 대기시간 알려주기"
        reward={2}
        done={missions.waittime}
        onClick={() => router.push("/report/new")}
      />
      <MissionCard
        icon="💰"
        title="오늘 시세 제보"
        desc="품목 가격 정보 공유하기"
        reward={2}
        done={missions.price}
        onClick={() => router.push("/board/write?category=price")}
      />

      <div style={{ margin: "24px 16px 0" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>이번 주 랭킹 🏆</h2>
        {rankings.map((user, i) => (
          <div
            key={user.deviceId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: "0.5px solid #EEEEEE",
            }}
          >
            <span style={{ fontSize: 16, width: 28, textAlign: "center" }}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
            </span>
            <span style={{ flex: 1, fontSize: 14 }}>{user.nickname}</span>
            <span style={{ fontSize: 13, color: "#1D9E75", fontWeight: 600 }}>{user.weeklyStamps}🪙</span>
          </div>
        ))}
        {!rankings.length && <div style={{ fontSize: 13, color: "#999", padding: "8px 0" }}>아직 랭킹 데이터가 없어요.</div>}
      </div>

      <div style={{ margin: "24px 16px 80px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>내 뱃지</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(BADGES).map(([key, badge]) => {
            const earned = badges.includes(key);
            return (
              <div
                key={key}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: earned ? "#F0FDF4" : "#F5F5F5",
                  border: `0.5px solid ${earned ? "#BBF7D0" : "#EEEEEE"}`,
                  opacity: earned ? 1 : 0.4,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24 }}>{badge.emoji}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{badge.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
