/* eslint-disable max-lines */
"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useLocale, useTranslations } from "next-intl";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  type Locale,
  usePathname as useIntlPathname,
  useRouter as useIntlRouter,
} from "@/i18n/routing";
import type { GlobeData } from "@/server/globe/types";

import { bootstrapGlobeScene } from "./globe-bootstrap";
import "./globe-scene.css";

type GlobeSceneProps = {
  data: GlobeData;
};

export default function GlobeScene({ data }: GlobeSceneProps) {
  const t = useTranslations("Globe");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    let path = intlPathname;
    const search = searchParams?.toString();
    if (search) path += `?${search}`;
    intlRouter.replace(
      // @ts-expect-error -- runtime path is always a valid match for current params
      { pathname: path, params },
      { locale: nextLocale },
    );
  };

  useEffect(() => {
    document.body.classList.add("globe-page-active");
    /* Pass a translation lookup into the imperative bootstrap so it can
       label dynamically-built stat cards, chips, and the autorotate badge.
       The cast widens next-intl's strict NamespacedMessageKeys to plain
       string, since the bootstrap module is decoupled from the message
       schema and only needs a key→value lookup. */
    const cleanup = bootstrapGlobeScene(
      (key: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t as unknown as (k: any) => string)(key),
      data,
      locale,
    );
    return () => {
      document.body.classList.remove("globe-page-active");
      cleanup?.();
    };
    // t, locale, and data are stable across the page lifetime; bootstrap only
    // needs the initial value, so the empty-deps array is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} lang={locale}>
      {/* WELCOME loader (full-screen, hidden after page load) */}
      <div className="ld" id="ld">
        <div className="ld-r"></div>
        <div className="ld-t">{t("loading")}</div>
      </div>

      {/* WELCOME Three.js canvas (stars, logo, orbit rings, meteors) */}
      <canvas id="c"></canvas>

      {/* Decorative letters backdrop. */}
      <div className="letters-bg-wrap" id="lettersBg" aria-hidden="true">
        <Image
          className="letters-bg"
          src="/globe/letters.png"
          alt=""
          fill
          sizes="100vw"
          priority
        />
      </div>

      {/* WELCOME white-flash overlay (mid-transition only) */}
      <div id="fl"></div>

      {/* WELCOME header (academy logo on the right, language button on the left) */}
      <div className="hdr" id="welcomeHdr">
        <div className="logo-bar">
          <Image
            src="/globe/logo.png"
            alt={t("academyAlt")}
            className="logo-img"
            width={400}
            height={150}
            priority
          />
        </div>
        <button className="lbtn">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          {t("siteLanguage")}
        </button>
      </div>

      {/* WELCOME click zone over the floating logo */}
      <div className="cz" id="cz">
        <div className="cz-hint">
          <span>{t("clickToEnter")}</span>
        </div>
      </div>

      <div id="map"></div>

      {/* Globe-mode brand logo */}
      <div className="globe-brand" id="globeBrand">
        <Image
          src="/globe/logo.png"
          alt={t("academyAlt")}
          width={400}
          height={150}
        />
      </div>

      {/* Globe-mode top-left controls — language + autorotate segmented
          toggles, identical pill shape, side by side. */}
      <div className="globe-controls" id="globeControls">
        <div
          className="globe-toggle globe-lang"
          id="globeLang"
          role="group"
          aria-label={t("siteLanguage")}
        >
          <button
            type="button"
            className={`gt-seg ${locale === "en" ? "active" : ""}`}
            onClick={() => handleLocaleChange("en" as Locale)}
            aria-pressed={locale === "en"}
          >
            EN
          </button>
          <button
            type="button"
            className={`gt-seg ${locale === "ar" ? "active" : ""}`}
            onClick={() => handleLocaleChange("ar" as Locale)}
            aria-pressed={locale === "ar"}
          >
            عربي
          </button>
        </div>

        <div
          className="globe-toggle"
          id="spinInd"
          role="group"
          aria-label={t("autoRotateOn")}
          title={t("autoRotateOn")}
        >
          <button
            type="button"
            className="gt-seg active"
            data-spin="on"
            aria-label={t("rotateAuto")}
            title={t("rotateAuto")}
          >
            <svg
              className="gt-ico gt-ico-rotate"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-3.5-7.1" />
              <polyline points="21 3.5 21 9 15.5 9" />
            </svg>
            <span>{t("rotateAuto")}</span>
          </button>
          <button
            type="button"
            className="gt-seg"
            data-spin="off"
            aria-label={t("rotateOff")}
            title={t("rotateOff")}
          >
            <svg
              className="gt-ico"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="9" y1="6" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="18" />
            </svg>
            <span>{t("rotateOff")}</span>
          </button>
        </div>
      </div>
      {/* Stat cards columns*/}
      <div className="stats-col right" id="statsRight"></div>
      <div className="stats-col left" id="statsLeft"></div>

      {/* Activities toggle button */}
      <button
        className="act-toggle-btn"
        id="activitiesToggleBtn"
        aria-label={t("showActivities")}
        title={t("exploreInternational")}
      >
        <span className="atb-icon" aria-hidden="true">
          <Image
            src="/icons/pin.png"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
        </span>
        <span className="atb-text">
          <span className="atb-title">{t("academyActivities")}</span>
        </span>
        <span className="atb-arrow" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 6 9 12 15 18"></polyline>
          </svg>
        </span>
      </button>

      {/* Activities panel */}
      <aside className="act-panel" id="activitiesPanel" aria-hidden="true">
        <header className="ap-head">
          <div className="ap-title">
            <span className="ap-title-bar"></span>
            <div>
              <h2>{t("academyActivities")}</h2>
              <span className="ap-sub">{t("panelSubtitle")}</span>
            </div>
          </div>
          <button
            className="ap-close"
            id="activitiesCloseBtn"
            aria-label={t("close")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div className="ap-pinned">
          <div className="ap-search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              id="actSearch"
              placeholder={t("searchPlaceholder")}
            />
          </div>

          <div className="ap-section">
            <div className="ap-section-label">{t("activityType")}</div>
            <div className="ap-chips" id="actTypeChips"></div>
          </div>
        </div>

        <div className="ap-body">
          <div className="ap-filters">
            <div
              className="ap-section"
              id="subtypeSection"
              style={{ display: "none" }}
            >
              <div className="ap-section-label">{t("subtype")}</div>
              <div className="ap-chips" id="actSubtypeChips"></div>
            </div>

            <div className="ap-row">
              <div className="ap-field">
                <label>{t("location")}</label>
                <div className="ap-select">
                  <select id="actLocationFilter"></select>
                </div>
              </div>
              <div className="ap-field">
                <label>{t("year")}</label>
                <div className="ap-select">
                  <select id="actYearFilter"></select>
                </div>
              </div>
            </div>

            <div className="ap-section">
              <div className="ap-section-label">{t("viewMode")}</div>
              <div className="ap-segment" id="actGroupBy">
                <button type="button" data-v="none" className="active">
                  {t("groupNone")}
                </button>
                <button type="button" data-v="year">
                  {t("groupYear")}
                </button>
                <button type="button" data-v="entity">
                  {t("groupEntity")}
                </button>
                <button type="button" data-v="type">
                  {t("groupType")}
                </button>
              </div>
            </div>

            <div
              className="ap-active-filters"
              id="actActiveFilters"
              hidden
            ></div>

            <div className="ap-results-head">
              <span className="ap-results-count" id="actResultsCount">
                <b>0</b>
                {t("matchingActivity")}
              </span>
              <button type="button" className="ap-reset-btn" id="actResetBtn">
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>{t("reset")}</span>
              </button>
            </div>
          </div>

          <div className="ap-list" id="actList"></div>
        </div>
      </aside>

      {/* Fallback loading indicator */}
      <div id="globeLoading" style={{ display: "none" }}>
        {t("globeLoading")}
      </div>

      {/* Page-level fader */}
      <div id="fader" className="page-fader">
        <div className="spinner"></div>
        <div id="faderText">{t("openingScene")}</div>
      </div>

      {/* Solid black overlay for hand-off between scenes */}
      <div id="transOverlay"></div>

      {/* Welcome back-button: visible only in globe mode */}
      <button
        className="back-btn"
        id="welcomeBackBtn"
        title={t("backToHome")}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>
  );
}
