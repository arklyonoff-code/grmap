"use client";

import { useMemo } from "react";
import type { ZoneWithStatus } from "@grmap/shared/types";
import { WAIT_LABELS } from "@grmap/shared/utils/report";

const SCORE: Record<ZoneWithStatus["congestionLevel"], number> = {
  green: 0,
  yellow: 1,
  red: 2,
  unknown: 3,
};

type Props = {
  zones: ZoneWithStatus[];
  onPress: (zone: ZoneWithStatus) => void;
};

export function BestZoneBanner({ zones, onPress }: Props) {
  const best = useMemo(() => {
    const ranked = [...zones]
      .filter((z) => z.congestionLevel !== "unknown")
      .sort((a, b) => SCORE[a.congestionLevel] - SCORE[b.congestionLevel]);
    return ranked[0];
  }, [zones]);

  if (!best) return null;

  const bg =
    best.congestionLevel === "green"
      ? "#1D9E75"
      : best.congestionLevel === "yellow"
        ? "#EF9F27"
        : "#E24B4A";

  return (
    <button
      type="button"
      className="best-zone-banner"
      style={{ backgroundColor: bg }}
      onClick={() => onPress(best)}
    >
      <span className="best-zone-banner__body">
        <span className="best-zone-banner__label">지금 가장 빠른 구역</span>
        <span className="best-zone-banner__name">{best.name}</span>
        <span className="best-zone-banner__wait">
          {best.latestReport ? WAIT_LABELS[best.latestReport.waitLevel] : "정보 없음"}
        </span>
      </span>
      <span className="best-zone-banner__arrow" aria-hidden>
        ›
      </span>
    </button>
  );
}
