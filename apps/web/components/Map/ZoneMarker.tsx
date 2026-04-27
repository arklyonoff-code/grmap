"use client";

import { useMemo } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { Zone } from "@grmap/shared/types";

export function ZoneMarker({
  zone,
  level,
  selected,
  onClick,
}: {
  zone: Zone;
  level: "green" | "yellow" | "red" | "unknown";
  selected: boolean;
  onClick: () => void;
}) {
  const bg = useMemo(() => {
    if (level === "green") return "#1D9E75";
    if (level === "yellow") return "#EF9F27";
    if (level === "red") return "#E24B4A";
    return "#B4B2A9";
  }, [level]);

  return (
    <AdvancedMarker position={{ lat: zone.lat, lng: zone.lng }} onClick={onClick}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: bg,
          border: selected ? "3px solid #fff" : "0",
          transform: selected ? "scale(1.15)" : "scale(1)",
          transition: "transform 150ms ease-out",
          opacity: selected ? 1 : 0.85,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {zone.shortName}
      </div>
    </AdvancedMarker>
  );
}
