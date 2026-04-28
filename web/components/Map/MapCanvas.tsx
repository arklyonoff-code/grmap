"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { CONGESTION_COLORS } from "@/constants/design";
import { getCongestionLevel } from "@/constants/mock-data";

interface Zone {
  id: string;
  shortName: string;
  lat: number;
  lng: number;
}

interface Report {
  zoneId: string;
  waitLevel: string;
  createdAt: number;
}

const GARAK_CENTER = { lat: 37.4929, lng: 127.119 };

export function MapCanvas({ zones, reports }: { zones: readonly Zone[]; reports: readonly Report[] }) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const latestByZone = useMemo(() => {
    const map = new Map<string, Report>();
    reports.forEach((report) => {
      const prev = map.get(report.zoneId);
      if (!prev || report.createdAt > prev.createdAt) {
        map.set(report.zoneId, report);
      }
    });
    return map;
  }, [reports]);

  return (
    <MapContainer
      center={GARAK_CENTER}
      zoom={16}
      zoomControl={false}
      attributionControl={true}
      className="leaflet-map"
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapStyler />
      {zones.map((zone) => {
        const latest = latestByZone.get(zone.id);
        const level = getCongestionLevel(latest?.waitLevel ?? "unknown");
        const isSelected = selectedZoneId === zone.id;
        return (
          <Marker
            key={zone.id}
            position={[zone.lat, zone.lng]}
            icon={createZoneIcon(zone.shortName, CONGESTION_COLORS[level], isSelected)}
            eventHandlers={{ click: () => setSelectedZoneId(zone.id) }}
          />
        );
      })}
    </MapContainer>
  );
}

function MapStyler() {
  const map = useMap();
  useEffect(() => {
    const pane = map.getPane("tilePane");
    if (pane) pane.style.filter = "saturate(40%)";
  }, [map]);
  return null;
}

function createZoneIcon(shortName: string, color: string, selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="zone-marker ${selected ? "selected" : ""}" style="background-color:${color}">${shortName}</div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}
