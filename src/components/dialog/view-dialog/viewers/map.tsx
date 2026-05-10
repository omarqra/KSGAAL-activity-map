"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useLocale } from "next-intl";

import { env } from "@/env/client";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER = { lat: 24.72169, lng: 46.75702 };

interface MapProps {
  lat?: number | string;
  lng?: number | string;
  zoom?: number;
  height?: string;
  className?: string;
  showMarker?: boolean;
}

function MapPlaceholder({
  message,
  height,
  className,
}: {
  message: string;
  height: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-muted/40 flex items-center justify-center rounded-lg border",
        className
      )}
      style={{ height }}
    >
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
export function Map({
  lat,
  lng,
  zoom = 15,
  height = "400px",
  className,
  showMarker = true,
}: MapProps) {
  const locale = useLocale();

  const latitude = Number(lat);
  const longitude = Number(lng);
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  const center = hasCoords ? { lat: latitude, lng: longitude } : DEFAULT_CENTER;

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: ["places", "routes"],
    language: locale,
  });

  if (!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.error("Missing Google Maps API Key");
    return (
      <MapPlaceholder
        message="Map unavailable - API key not configured"
        height={height}
        className={className}
      />
    );
  }

  if (!isLoaded) {
    return (
      <MapPlaceholder
        message="Loading map..."
        height={height}
        className={className}
      />
    );
  }

  if (!hasCoords) {
    return (
      <MapPlaceholder
        message="Location coordinates not available"
        height={height}
        className={className}
      />
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg", className)}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height }}
        center={center}
        zoom={zoom}
        options={{
          fullscreenControl: true,
          streetViewControl: true,
          mapTypeControl: false,
          zoomControl: true,
          gestureHandling: "cooperative",
        }}
      >
        {showMarker && <Marker position={center} />}
      </GoogleMap>
    </div>
  );
}
