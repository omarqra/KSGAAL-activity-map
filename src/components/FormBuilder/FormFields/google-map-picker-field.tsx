"use client";

import { useState } from "react";

import {
  GoogleMap,
  GoogleMapProps,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useLocale, useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { env } from "@/env/client";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 24.72169,
  lng: 46.75702,
};

export type GoogleMapPickerProps = BaseFieldComponentProps & {
  onChange?: (value: { lat: number; lng: number } | null) => void;
  mapProps?: Omit<
    GoogleMapProps,
    "center" | "onClick" | "mapContainerStyle"
  > & {
    height?: string;
  };
  defaultCenter?: { lat: number; lng: number };
};

const GoogleMapPicker = ({
  name,
  control,
  label,
  required = false,
  containerClassName,
  errorClassName,
  labelClassName,
  LabelComponent,
  ErrorComponent,
  onChange,
  mapProps,
  defaultCenter: propDefaultCenter,
  disabled = false,
  hidden = false,
}: GoogleMapPickerProps) => {
  const [mapCenter, setMapCenter] = useState(
    propDefaultCenter || defaultCenter
  );
  const t = useTranslations();
  const locale = useLocale();

  if (!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.error(
      "Google Maps API Key is not set, you need to set correct one in the .env file by name NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
    );
  }

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: ["places", "routes"],
    language: locale,
    id: "google-map-script",
  });

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const handleMapClick = (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const coords = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            };
            setMapCenter(coords);
            field.onChange(coords);
            if (onChange) onChange(coords);
          }
        };

        const {
          height = "400px",
          zoom = 7,
          options = {
            fullscreenControl: false,
            streetViewControl: false,
            clickableIcons: false,
            gestureHandling: "cooperative",
          },
          ...restMapProps
        } = mapProps || {};

        return (
          <FieldWrapper
            disabled={disabled}
            hidden={hidden}
            defaultClassName="col-span-12 space-y-2"
            containerClassName={containerClassName}
          >
            <FieldLabel
              LabelComponent={LabelComponent}
              label={label}
              htmlFor={name}
              labelClassName={labelClassName}
              required={required}
            />

            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{ ...containerStyle, height }}
                center={field.value || mapCenter}
                zoom={zoom}
                onClick={handleMapClick}
                options={options}
                {...restMapProps}
              >
                {field.value && <Marker position={field.value} />}
              </GoogleMap>
            )}

            {field.value?.lat && (
              <div className="mt-2 bg-gray-100 p-2 text-sm">
                {t("Location")}
                {":"} {field.value?.lat?.toFixed(5)}
                {","} {field.value?.lng?.toFixed(5)}
              </div>
            )}

            <FieldError
              ErrorComponent={ErrorComponent}
              error={error}
              errorClassName={errorClassName}
            />
          </FieldWrapper>
        );
      }}
    />
  );
};

export default GoogleMapPicker;
