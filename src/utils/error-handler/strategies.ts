/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from "js-cookie";
import { toast } from "sonner";

import { Locale } from "@/i18n/routing";

import type { ErrorStrategy } from "./types";
import { createErrorCodeStrategy, createHttpErrorStrategy } from "./utils";

// Helper function to get current locale
const getCurrentLocale = (): Locale => {
  return (Cookies.get("NEXT_LOCALE") as Locale) ?? "ar";
};

// Default error strategies using utility functions
export const defaultErrorStrategies: ErrorStrategy[] = [
  // Authentication errors (401)
  createHttpErrorStrategy(401, (error: any) => {
    console.error("Authentication Error:", error);

    // التحويل إلى صفحة تسجيل الدخول
    if (typeof window !== "undefined") {
      const locale = getCurrentLocale();
      window.location.href = `/${locale}/auth/login?redirect=${window.location.pathname}`;
    }
  }),

  // Permission errors (403)
  // createHttpErrorStrategy(403, (error: any) => {
  //   console.error("Permission Error:", error);

  //   // التحويل إلى صفحة تسجيل الدخول
  //   if (typeof window !== "undefined") {
  //     const locale = getCurrentLocale();
  //     window.location.href = `/${locale}/not-authorized`;
  //   }
  // }),

  // Additional strategies using utility functions

  // 404 Not Found errors
  // createHttpErrorStrategy(404, (error: any) => {
  //   console.error("Resource not found:", error);
  //   // يمكن إضافة redirect إلى 404 page
  //   if (typeof window !== "undefined") {
  //     const locale = getCurrentLocale();
  //     window.location.href = `/${locale}/not-found`;
  //   }
  // }),

  // 500 Internal Server Error
  // createHttpErrorStrategy(500, (error: any) => {
  //   console.error("Internal server error:", error);
  //   // يمكن إضافة عرض رسالة "Server is down"
  //   if (typeof window !== "undefined") {
  //     const locale = getCurrentLocale();
  //     window.location.href = `/${locale}/server-error`;
  //   }
  // }),

  createHttpErrorStrategy(429, (error: any) => {
    console.error("Too many requests:", error);
    if (typeof window !== "undefined") {
      const locale = getCurrentLocale();
      window.location.href = `/${locale}/too-many-requests`;
    }
  }),

  // // Error code based strategies
  // createErrorCodeStrategy(
  //   "UNAUTHORIZED",
  //   ["UNAUTHORIZED", "AUTH_FAILED"],
  //   (error: any) => {
  //     console.error("Authorization failed:", error);
  //     // يمكن إضافة redirect إلى login
  //   }
  // ),

  // createErrorCodeStrategy(
  //   "VALIDATION_ERROR",
  //   ["VALIDATION_ERROR", "INVALID_DATA"],
  //   (error: any) => {
  //     console.error("Data validation failed:", error);
  //     // يمكن إضافة عرض validation errors
  //   }
  // ),

  // // Message pattern for common error messages
  // createMessagePatternStrategy(
  //   "GenericError",
  //   ["error", "failed", "exception"],
  //   (error: any) => {
  //     console.error("Generic error occurred:", error);
  //     // يمكن إضافة generic error handling
  //   }
  // ),
  // Error network timeout
  createErrorCodeStrategy("NetworkError", ["ERR_NETWORK"], () => {
    if (typeof window !== "undefined") {
      const locale = getCurrentLocale();
      const isArabic = locale === "ar";
      toast(isArabic ? "مشكلة في الشبكة" : "Network issue", {
        description: isArabic
          ? "يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."
          : "Please check your internet connection and try again.",
      });
    }
  }),
];

// Fallback strategy
export const fallbackErrorStrategy: ErrorStrategy = {
  name: "FallbackError",
  canHandle: () => true, // يمكنه التعامل مع أي error
  handle: (error: any) => {
    console.error("Unhandled Error:", error);
    // يمكن إضافة generic error handling
  },
};
