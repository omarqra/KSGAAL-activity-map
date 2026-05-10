"use client";

import { useEffect, useRef } from "react";

import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { Button } from "@/components/ui/button";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationPickerLabels {
  empty: string;
  clear: string;
  centerHost?: string;
}

interface Props {
  value: LatLng | null;
  onChange: (next: LatLng | null) => void;
  defaultCenter: LatLng;
  defaultZoom: number;
  hostCenter?: LatLng | null;
  hostZoom?: number;
  /**
   * When this token changes (and `value` is set), the map flies to `value`
   * with `hostZoom`/`defaultZoom`. Use it from forms that programmatically
   * set `value` (e.g. picking a country auto-fills its centroid) so the
   * viewport follows. Click-to-pick flows omit this and stay still.
   */
  flyToValueKey?: string | number | null;
  labels: LocationPickerLabels;
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

export function LocationPicker({
  value,
  onChange,
  defaultCenter,
  defaultZoom,
  hostCenter,
  hostZoom,
  flyToValueKey,
  labels,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || value || !hostCenter) return;
    map.flyTo({
      center: [hostCenter.lng, hostCenter.lat],
      zoom: hostZoom ?? defaultZoom,
      essential: true,
    });
  }, [hostCenter, hostZoom, value, defaultZoom]);

  /* Imperative recenter when the parent flips `flyToValueKey` (e.g. after the
     country picker auto-fills coordinates). Stays inert for click-to-pick
     flows that never set the prop. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value || flyToValueKey === undefined || flyToValueKey === null)
      return;
    map.flyTo({
      center: [value.lng, value.lat],
      zoom: hostZoom ?? defaultZoom,
      essential: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToValueKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const marker = new maplibregl.Marker({
        color: "#024E28",
        draggable: true,
      })
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
      zoom: hostZoom ?? defaultZoom,
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
          {value ? (
            `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          ) : (
            <span dir="rtl" className="text-aws-text3">
              {labels.empty}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {hostCenter && labels.centerHost && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCenterOnHost}
            >
              {labels.centerHost}
            </Button>
          )}
          {value && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleClear}
            >
              {labels.clear}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
