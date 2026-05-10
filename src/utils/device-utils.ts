import moment from "moment";
import { Messages, _Translator } from "next-intl";

import { Locale } from "@/i18n/routing";
import { MeData } from "@/types/apis-types";

export type Device = MeData["devices"][number];

/**
 * Utility functions for device and session management
 */

/**
 * Parses device info string to extract browser, OS, and device type
 */
export const parseDeviceInfo = (deviceInfo: string) => {
  const parts = deviceInfo.split("|");
  const userAgent = parts[0]?.trim() || "";
  const os = parts[2]?.replace(/"/g, "").trim() || "Unknown";

  // Extract browser from user agent
  let browser = "Unknown Browser";
  if (userAgent.includes("Edg/")) {
    browser = "Edge";
  } else if (userAgent.includes("Chrome/")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Firefox/")) {
    browser = "Firefox";
  }

  // Determine device type from OS and user agent
  let deviceType = "Desktop";
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
    deviceType = "Mobile";
  }

  return { browser, os, deviceType };
};

/**
 * Gets the appropriate icon for a device based on its name
 */
export const getDeviceIcon = (device: string): string => {
  if (device.includes("Android") || device.toLowerCase().includes("mobile")) {
    return "mdi:cellphone";
  } else if (device.includes("Mac")) {
    return "mdi:laptop-mac";
  } else if (device.includes("Windows")) {
    return "mdi:laptop-windows";
  }
  return "mdi:laptop";
};

/**
 * Formats a date string to relative time (e.g., "2 hours ago", "Active now")
 * For LTR languages (English): "25 minutes ago"
 * For RTL languages (Arabic): "منذ 25 دقائق" (ago comes first in Arabic)
 */
export const formatRelativeTime = (
  dateString: string,
  t: _Translator<Messages>,
  locale: Locale = "en"
): string => {
  moment.locale(locale);

  const date = moment(dateString);
  const now = moment();
  const diffInSeconds = now.diff(date, "seconds");

  if (diffInSeconds < 60) {
    return t("Active now");
  }

  return date.fromNow();
};

/**
 * Finds the current device (the one with the latest updated_at)
 */
export const findCurrentDevice = (devices: Device[]): Device | null => {
  if (!devices || devices.length === 0) {
    return null;
  }

  return devices.reduce((latest, device) => {
    const latestDate = new Date(latest.updated_at).getTime();
    const deviceDate = new Date(device.updated_at).getTime();
    return deviceDate > latestDate ? device : latest;
  });
};
