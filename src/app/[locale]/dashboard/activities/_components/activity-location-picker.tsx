"use client";

import { useEffect, useRef } from "react";

import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { useTranslations } from "next-intl";

import "maplibre-gl/dist/maplibre-gl.css";

import { Button } from "@/components/ui/button";

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  onChange: (next: LatLng | null) => void;
  defaultCenter: LatLng;
  defaultZoom: number;
  hostCenter: LatLng | null;
  hostZoom: number;
}

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export function ActivityLocationPicker({
  value,
  onChange,
  defaultCenter,
  defaultZoom,
  hostCenter,
  hostZoom,
}: Props) {
  const t = useTranslations("ActivitiesPage");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = value
      ? [value.lng, value.lat]
      : [defaultCenter.lng, defaultCenter.lat];
    const initialZoom = value ? 8 : defaultZoom;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      onChangeRef.current({ lat, lng });
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // Initial mount only — defaults are read once; subsequent updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fly to host when no location is set yet.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || value || !hostCenter) return;
    map.flyTo({
      center: [hostCenter.lng, hostCenter.lat],
      zoom: hostZoom,
      essential: true,
    });
  }, [hostCenter, hostZoom, value]);

  // Sync marker with value.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const marker = new maplibregl.Marker({ color: "#024E28", draggable: true })
        .setLngLat([value.lng, value.lat])
        .addTo(map);
      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat();
        onChangeRef.current({ lat, lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([value.lng, value.lat]);
    }
  }, [value]);

  const handleCenterOnHost = () => {
    const map = mapRef.current;
    if (!map || !hostCenter) return;
    map.flyTo({
      center: [hostCenter.lng, hostCenter.lat],
      zoom: hostZoom,
      essential: true,
    });
  };

  const handleClear = () => {
    onChangeRef.current(null);
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="border-aws-border h-65 w-full overflow-hidden rounded border"
        dir="ltr"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="text-aws-text2 num text-[11px]" dir="ltr">
          {value
            ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : ""}
          {!value && (
            <span dir="rtl" className="text-aws-text3">
              {t("formLocationEmpty")}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {hostCenter && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCenterOnHost}
            >
              {t("formLocationCenterHost")}
            </Button>
          )}
          {value && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleClear}
            >
              {t("formLocationClear")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
