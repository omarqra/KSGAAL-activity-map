"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import type { GlobeStats } from "@/server/globe/types";

type GlobeHeroProps = {
  stats: GlobeStats;
};

/* Canonical activity-type keys (Arabic identifiers from the seed data).
   Order here is the visual order of the four breakdown columns in the
   trailing half of the dock. */
const TYPE_ORDER = [
  "الفعاليات",
  "التعليم_والتدريب",
  "الشراكات_والاتفاقيات",
  "البحوث_العلمية_والكتب",
] as const;

type TypeKey = (typeof TYPE_ORDER)[number];

type TypeLabelKey =
  | "heroBarEvents"
  | "heroBarTraining"
  | "heroBarPartnerships"
  | "heroBarResearch";

const TYPE_LABEL_KEY: Record<TypeKey, TypeLabelKey> = {
  الفعاليات: "heroBarEvents",
  التعليم_والتدريب: "heroBarTraining",
  الشراكات_والاتفاقيات: "heroBarPartnerships",
  البحوث_العلمية_والكتب: "heroBarResearch",
};

/* Type identity dots. Brand-palette accents are used as small categorical
   markers next to each label. The DB-seeded `color` on each activity-type
   row is ignored here on purpose; the renderer is the source of truth. */
const TYPE_ACCENT: Record<TypeKey, string> = {
  الفعاليات: "#D56028",
  التعليم_والتدريب: "#459AA8",
  الشراكات_والاتفاقيات: "#F5CC44",
  البحوث_العلمية_والكتب: "#57072D",
};

export default function GlobeHero({ stats }: GlobeHeroProps) {
  const t = useTranslations("Globe");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* Two RAFs let the browser commit the dock at opacity 0 before the
       .ready class fades it in, so the CSS opacity transition plays. */
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const byTypeMap = new Map(stats.byType.map((b) => [b.key, b.count]));
  const rows = TYPE_ORDER.map((key) => ({
    key,
    label: t(TYPE_LABEL_KEY[key]),
    accent: TYPE_ACCENT[key],
    count: byTypeMap.get(key) ?? 0,
  }));

  return (
    <aside
      className={`globe-dock${ready ? " ready" : ""}`}
      aria-label={t("heroIdleTitle")}
    >
      <div className="gd-inner">
        <div className="gd-hero">
          <span className="gd-eyebrow">{t("heroIdleTitle")}</span>
          <span className="gd-number num">{stats.totalActivities}</span>
          <span className="gd-subtitle">{t("internationalActivity")}</span>
        </div>
        <div className="gd-rule" aria-hidden="true"></div>
        <ul className="gd-stats">
          {rows.map((r) => (
            <li key={r.key} className="gd-stat">
              <div className="gd-stat-head">
                <span
                  className="gd-stat-dot"
                  style={{ background: r.accent }}
                  aria-hidden="true"
                ></span>
                <span className="gd-stat-label">{r.label}</span>
              </div>
              <span className="gd-stat-value num">{r.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
