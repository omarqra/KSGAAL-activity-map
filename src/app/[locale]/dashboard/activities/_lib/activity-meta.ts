import {
  BookOpen,
  Calendar,
  GraduationCap,
  Handshake,
  Layers,
  type LucideIcon,
  Users,
} from "lucide-react";

export type BadgeVariant =
  | "info"
  | "warn"
  | "success"
  | "error"
  | "neutral";

/** Visual-only metadata indexed by the activity-type `key` from the database.
 *  Localized labels and accent color come from the API. */
export interface ActivityTypeVisual {
  icon: LucideIcon;
  variant: BadgeVariant;
  identifier: string;
  /** Fallback color if the API row has none. */
  fallbackColor: string;
}

const VISUALS: Record<string, ActivityTypeVisual> = {
  الفعاليات: {
    icon: Calendar,
    variant: "warn",
    identifier: "type-events",
    fallbackColor: "#D56028",
  },
  التعليم_والتدريب: {
    icon: GraduationCap,
    variant: "info",
    identifier: "type-education",
    fallbackColor: "#193D58",
  },
  البحوث_العلمية_والكتب: {
    icon: BookOpen,
    variant: "success",
    identifier: "type-research",
    fallbackColor: "#024E28",
  },
  الشراكات_والاتفاقيات: {
    icon: Handshake,
    variant: "info",
    identifier: "type-partnerships",
    fallbackColor: "#459AA8",
  },
  اللقاءات_الرسمية: {
    icon: Users,
    variant: "error",
    identifier: "type-meetings",
    fallbackColor: "#57072D",
  },
};

const FALLBACK_VISUAL: ActivityTypeVisual = {
  icon: Layers,
  variant: "neutral",
  identifier: "type-other",
  fallbackColor: "#474747",
};

export function getTypeVisual(key: string): ActivityTypeVisual {
  return VISUALS[key] ?? FALLBACK_VISUAL;
}

/** Brand-palette color for an activity type. Always returns a palette color
 *  regardless of what the API has stored — the brand identity is the source
 *  of truth, not the database. */
export function getTypeColor(key: string): string {
  return getTypeVisual(key).fallbackColor;
}

