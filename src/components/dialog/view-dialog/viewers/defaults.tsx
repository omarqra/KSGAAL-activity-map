/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import { JSX } from "react";

import { Map } from "./map";

export const StringViewer: React.FC<{
  label: string;
  value: string;
  textColor?: string;
  fontSize?: string;
  valueClassName?: string;
}> = ({
  label,
  value,
  textColor = "text-foreground",
  fontSize = "text-base",
  valueClassName = "",
}) => (
  <div>
    <div className="mb-1 font-semibold">{label}</div>
    <p className={`${textColor} ${fontSize} ${valueClassName}`}>{value}</p>
  </div>
);

export const StringTitleViewer: React.FC<{
  label: string;
  value: string;
  textColor?: string;
  fontSize?: string;
}> = ({
  label,
  value,
  textColor = "text-foreground",
  fontSize = "text-xl",
}) => (
  <div>
    <div className="mb-1 font-semibold">{label}</div>
    <h2 className={`${textColor} ${fontSize} font-bold`}>{value}</h2>
  </div>
);

export const NumberViewer: React.FC<{
  label: string;
  value: number;
  unit?: string;
}> = ({ label, value, unit }) => (
  <div>
    <div className="mb-1 font-semibold">{label}</div>
    <span>
      {value}
      {unit && ` ${unit}`}
    </span>
  </div>
);

export const DateViewer: React.FC<{
  label: string;
  value: Date | string;
  locale?: string;
  formatOptions?: Intl.DateTimeFormatOptions;
}> = ({ label, value, locale = "en-US", formatOptions }) => {
  const dateObj = typeof value === "string" ? new Date(value) : value;
  return (
    <div>
      <div className="mb-1 font-semibold">{label}</div>
      <time>{dateObj.toLocaleDateString(locale, formatOptions)}</time>
    </div>
  );
};

export const BooleanViewer: React.FC<{
  label: string;
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}> = ({ label, value, trueLabel = "Yes", falseLabel = "No" }) => (
  <div>
    <div className="mb-1 font-semibold">{label}</div>
    <span>{value ? trueLabel : falseLabel}</span>
  </div>
);

export const ListViewer: React.FC<{
  label: string;
  value: any[];
  itemRenderer?: (item: any, index: number) => React.ReactNode;
}> = ({ label, value, itemRenderer }) => (
  <div>
    <div className="mb-1 font-semibold">{label}</div>
    <ul className="list-inside list-disc">
      {value.map((item, idx) => (
        <li key={idx}>
          {itemRenderer ? itemRenderer(item, idx) : String(item)}
        </li>
      ))}
    </ul>
  </div>
);

export const ImageViewer: React.FC<{
  label: string;
  value: string; // رابط الصورة
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}> = ({
  label,
  value,
  alt = "",
  width = 300,
  height = 200,
  className = "",
}) => (
  <div>
    <div className="mb-1 font-semibold">{label}</div>
    <div
      className={`relative h-auto w-full ${className}`}
      style={{ width, height }}
    >
      <Image
        src={value}
        alt={alt}
        width={width}
        height={height}
        objectFit="cover"
      />
    </div>
  </div>
);

export const ObjectViewer: React.FC<{
  label: string;
  value: Record<string, any>;
  depth?: number;
  maxDepth?: number;
  className?: string;
}> = ({ label, value, depth = 0, maxDepth = 3, className = "" }) => {
  if (depth >= maxDepth) {
    return (
      <div className={className}>
        <div className="mb-1 font-semibold">{label}</div>
        <div className="text-sm text-gray-500 italic">
          [Object - Max depth reached]
        </div>
      </div>
    );
  }

  const renderValue = (val: any): React.ReactNode => {
    if (val === null) return <span className="text-gray-500">null</span>;
    if (val === undefined)
      return <span className="text-gray-500">undefined</span>;
    if (typeof val === "string")
      return <span className="text-blue-600">&quot;{val}&quot;</span>;
    if (typeof val === "number")
      return <span className="text-green-600">{val}</span>;
    if (typeof val === "boolean")
      return <span className="text-purple-600">{val.toString()}</span>;
    if (Array.isArray(val))
      return <span className="text-orange-600">[{val.length} items]</span>;
    if (typeof val === "object")
      return <span className="text-gray-600">{"..."}</span>;
    return String(val);
  };
  return (
    <div className={className}>
      <div className="mb-2 font-semibold">{label}</div>
      <div className="rounded border border-gray-200 bg-gray-50 p-3">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="mb-2 last:mb-0">
            <div className="flex items-start gap-2">
              <span className="min-w-0 shrink-0 text-sm font-medium text-gray-700">
                {key}:
              </span>
              <div className="min-w-0 flex-1">
                {typeof val === "object" &&
                val !== null &&
                !Array.isArray(val) &&
                depth < maxDepth - 1 ? (
                  <ObjectViewer
                    label=""
                    value={val}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    className="mt-1"
                  />
                ) : (
                  <div className="text-sm">{renderValue(val)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MapViewer: React.FC<{
  label: string;
  value: { lat: number | string; lng: number | string };
  zoom?: number;
  height?: string;
}> = ({ label, value, zoom = 15, height = "400px" }) => (
  <div>
    <div className="mb-2 font-semibold">{label}</div>
    <Map lat={value.lat} lng={value.lng} zoom={zoom} height={height} />
  </div>
);

export const CustomViewer: React.FC<{
  label: string;
  CustomComponent?: JSX.Element;
}> = ({ label, CustomComponent }) => (
  <div>
    <div className="mb-2 font-semibold">{label}</div>
    {CustomComponent}
  </div>
);
export const MultiLanguageViewer: React.FC<{
  label: string;
  value: Record<string, string> | null | undefined;
}> = ({ label, value }) => {
  const entries =
    value && typeof value === "object"
      ? Object.entries(value).filter(([, v]) => v)
      : [];
  return (
    <div>
      <div className="mb-1 font-semibold">{label}</div>
      {entries.length > 0 ? (
        <div className="flex flex-col gap-2">
          {entries.map(([lang, text]) => (
            <div key={lang} className="flex flex-wrap items-center gap-2">
              <span className="bg-muted text-muted-foreground rounded border px-2 py-0.5 text-[10px] font-semibold uppercase">
                {lang}
              </span>
              <span className="text-sm">{text.trim() || "-"}</span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      )}
    </div>
  );
};
