"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";

export function MapContainer({
  children,
  onMapClick,
  mapStyle,
}: {
  children: React.ReactNode;
  onMapClick: () => void;
  mapStyle: google.maps.MapTypeStyle[];
}) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <Map
        defaultCenter={{ lat: 37.4929, lng: 127.119 }}
        defaultZoom={16}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
        style={{ width: "100%", height: "100%" }}
        disableDefaultUI
        gestureHandling="greedy"
        onClick={onMapClick}
        styles={mapStyle}
      >
        {children}
      </Map>
    </APIProvider>
  );
}
