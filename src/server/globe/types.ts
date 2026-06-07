/**
 * Shape consumed by the globe scene bootstrap. Mirrors the historical
 * `activities.json` schema so the imperative MapLibre/Three.js layer keeps
 * working unchanged after the migration to Prisma.
 */

export type GlobeActivity = {
  name: string;
  type: string;
  subtype: string | null;
  date: string;
  /** Optional rich detail surfaced in the public activity card (BRD #32/#38). */
  description?: string | null;
  images?: string[];
  /** Custom override coordinates. When present, the activity is rendered at
   *  exactly this point and skips the per-entity scatter offset. When null,
   *  the activity inherits its parent country/organization position. */
  lat?: number | null;
  lng?: number | null;
};

export type GlobeEntity = {
  code: string;
  name: string;
  short?: string;
  en?: string;
  capital?: string;
  lat: number;
  lng: number;
  hasDetailedMap?: boolean;
  activities?: GlobeActivity[];
};

export type GlobeActivityTypeMeta = {
  color?: string;
  label?: string;
};

export type GlobeTypeStat = {
  key: string;
  count: number;
};

export type GlobeStats = {
  totalActivities: number;
  byType: GlobeTypeStat[];
};

export type GlobeData = {
  meta?: Record<string, string>;
  activityTypes: Record<string, GlobeActivityTypeMeta>;
  countries: GlobeEntity[];
  organizations: GlobeEntity[];
  stats: GlobeStats;
};
