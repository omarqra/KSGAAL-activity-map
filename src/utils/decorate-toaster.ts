/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError } from "axios";
import Cookies from "js-cookie";
import { toast as toastSonner } from "sonner";

import { Locale } from "@/i18n/routing";

// Types
interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  message?: string;
}

interface ToasterOptions<T = unknown> {
  errorMessage?: string | boolean;
  successMessage?: string | boolean;
  loadingMessage?: string | boolean;
  afterSuccess?: (response: T) => void;
  afterFailed?: (error: ApiResponse) => void;
  afterFinally?: () => void;
  /**
   * مقدار التأخير حتى تختفي الرسالة بالميلي ثانية
   */
  disableDelays?: boolean;
  /**
   * إذا كان true لن تظهر أي رسائل توست
   */
  disabled?: boolean;
}

// Default messages
const DEFAULT_MESSAGES = {
  ar: {
    loading: "جار المعالجة ...",
    success: "تم العملية بنجاح",
    error: "حدث خطأ اثناء الاتصال بالسيرفر",
  },
  en: {
    loading: "Loading...",
    success: "Operation successful",
    error: "There was an error while connecting to the server",
  },
} as const;

// Helper functions
const getLocale = (): Locale => {
  return (Cookies.get("NEXT_LOCALE") as Locale) ?? "ar";
};

const getMessage = (
  customMessage: string | boolean | undefined,
  defaultMessage: string
): string | false => {
  if (customMessage === false) return false;
  if (typeof customMessage === "string") return customMessage;
  return defaultMessage;
};

const isErrorResponse = (result: any): result is ApiResponse => {
  return result && typeof result === "object" && result.ok === false;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Main toaster function
const decorateToaster = async <T = unknown>(
  promise: Promise<T>,
  options: ToasterOptions<T> = {}
): Promise<T | undefined> => {
  const {
    errorMessage,
    successMessage,
    loadingMessage,
    afterSuccess,
    afterFailed,
    afterFinally,
    disableDelays = false,
    disabled = false,
  } = options;

  const locale = getLocale();
  const messages = DEFAULT_MESSAGES[locale];

  let loaderId: string | number | null = null;

  try {
    // Show loading message
    const loadingMsg = getMessage(loadingMessage, messages.loading);
    if (loadingMsg !== false && !disabled) {
      loaderId = toastSonner.loading(loadingMsg);
    }

    // Execute the promise
    const result = await promise;

    // Remove loading message with minimal delay
    if (loaderId) {
      if (!disableDelays) {
        await sleep(50);
      }
      toastSonner.dismiss(loaderId);
    }

    // Handle response
    if (isErrorResponse(result)) {
      // Error case
      afterFailed?.(result);

      const errorMsg = getMessage(
        errorMessage,
        result.data?.message || messages.error
      );

      if (errorMsg !== false && !disabled) {
        toastSonner.error(errorMsg);
      }
    } else {
      // Success case
      afterSuccess?.(result);

      const successMsg = getMessage(successMessage, messages.success);
      if (successMsg !== false && !disabled) {
        if (!disableDelays) {
          await sleep(100);
        }
        toastSonner.success(successMsg);
      }
    }

    return result;
  } catch (error) {
    // Handle unexpected errors
    if (loaderId) {
      toastSonner.dismiss(loaderId);
    }

    const errorMsg = getMessage(
      errorMessage,
      error instanceof AxiosError
        ? error.response?.data.message
        : error instanceof Error
          ? error.message
          : messages.error
    );

    if (errorMsg !== false && !disabled) {
      toastSonner.error(errorMsg);
    }

    // Call afterFailed with a generic error object
    const genericError: ApiResponse = {
      data: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      status: 500,
      ok: false,
    };
    console.error(error);

    afterFailed?.(genericError);
    // throw error;
  } finally {
    afterFinally?.();
  }
};

export default decorateToaster;
