"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { WaitReport } from "@grmap/shared/types";
import { getCongestionLevel } from "@grmap/shared/utils/report";

export function ReportPin({
  report,
  lat,
  lng,
}: {
  report: WaitReport;
  lat: number;
  lng: number;
}) {
  const level = getCongestionLevel(report);
  const color = level === "green" ? "#1D9E75" : level === "yellow" ? "#EF9F27" : level === "red" ? "#E24B4A" : "#B4B2A9";

  return (
    <AdvancedMarker position={{ lat, lng }}>
      <div style={{ width: 10, height: 10, borderRadius: 10, background: color, border: "1px solid #fff" }} />
    </AdvancedMarker>
  );
}
