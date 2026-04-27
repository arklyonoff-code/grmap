"use client";

import { useEffect, useMemo } from "react";
import { MOCK_ZONES } from "@grmap/shared/constants/mock-zones";
import { getCongestionLevel } from "@grmap/shared/utils/report";
import { fetchZonesFromFirebase, subscribeActiveReports } from "@/lib/firebase";
import { MapContainer } from "@/components/Map/MapContainer";
import { ReportPin } from "@/components/Map/ReportPin";
import { ZoneMarker } from "@/components/Map/ZoneMarker";
import { MapLegend } from "@/components/Map/MapLegend";
import { ZoneDetailSheet } from "@/components/Sheet/ZoneDetailSheet";
import { ReportForm } from "@/components/Sheet/ReportForm";
import { useMapStore } from "@/store/useMapStore";

const GRAYSCALE_MAP_STYLE = [
  { featureType: "all", elementType: "geometry", stylers: [{ saturation: -35 }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "off" }] },
];

export default function HomePage() {
  const zones = useMapStore((s) => s.zones);
  const reports = useMapStore((s) => s.activeReports);
  const selectedZoneId = useMapStore((s) => s.selectedZoneId);
  const isReportFormOpen = useMapStore((s) => s.isReportFormOpen);
  const setZones = useMapStore((s) => s.setZones);
  const setReports = useMapStore((s) => s.setReports);
  const setSelectedZone = useMapStore((s) => s.setSelectedZone);
  const openReportForm = useMapStore((s) => s.openReportForm);
  const closeReportForm = useMapStore((s) => s.closeReportForm);

  useEffect(() => {
    setZones(MOCK_ZONES);
    void fetchZonesFromFirebase().then((firebaseZones) => {
      if (firebaseZones.length) setZones(firebaseZones);
    });
    const unsub = subscribeActiveReports((nextReports) => setReports(nextReports));
    return unsub;
  }, [setReports, setZones]);

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  );

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <MapContainer
        onMapClick={() => setSelectedZone(null)}
        mapStyle={GRAYSCALE_MAP_STYLE as google.maps.MapTypeStyle[]}
      >
        {zones.map((zone) => {
          const latest = reports.find((r) => r.zoneId === zone.id) ?? null;
          return (
            <ZoneMarker
              key={zone.id}
              zone={zone}
              level={getCongestionLevel(latest)}
              selected={selectedZoneId === zone.id}
              onClick={() => setSelectedZone(zone.id)}
            />
          );
        })}
        {reports.map((report) => {
          const zone = zones.find((z) => z.id === report.zoneId);
          if (!zone) return null;
          return <ReportPin key={report.id} report={report} lat={zone.lat} lng={zone.lng} />;
        })}
      </MapContainer>

      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 4, display: "flex", gap: 8 }}>
        <span className="chip">GRmap</span>
        <button className="btn" onClick={() => selectedZone && openReportForm()}>
          제보하기
        </button>
      </div>
      <MapLegend />

      {selectedZone ? (
        <ZoneDetailSheet
          zone={selectedZone}
          reports={reports.filter((r) => r.zoneId === selectedZone.id)}
          onClose={() => setSelectedZone(null)}
          onOpenReport={openReportForm}
        />
      ) : null}
      {selectedZone && isReportFormOpen ? (
        <ReportForm zone={selectedZone} onClose={closeReportForm} />
      ) : null}
    </div>
  );
}
