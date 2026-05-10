// Generic Toaster Types
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
  message?: string;
}

export interface ToastOptions<T = unknown> {
  errorMessage?: string | boolean;
  successMessage?: string | boolean;
  loadingMessage?: string | boolean;
  afterSuccess?: (response: T) => void;
  afterFailed?: (error: ApiResponse) => void;
  afterFinally?: () => void;
  disableDelays?: boolean;
}

export type ToastFunction = <T = unknown>(
  promise: Promise<T>,
  options?: ToastOptions<T>
) => Promise<T>;

// Toast Message Types
export interface ToastMessages {
  loading: string;
  success: string;
  error: string;
}

export interface LocalizedMessages {
  ar: ToastMessages;
  en: ToastMessages;
}

// Toast Hook Types
export interface ToastHookReturn {
  showToast: ToastFunction;
  showSuccessToast: <T = unknown>(
    promise: Promise<T>,
    successMessage?: string,
    options?: Omit<ToastOptions<T>, "successMessage">
  ) => Promise<T>;
  showErrorToast: <T = unknown>(
    promise: Promise<T>,
    errorMessage?: string,
    options?: Omit<ToastOptions<T>, "errorMessage">
  ) => Promise<T>;
  showCustomToast: <T = unknown>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    },
    options?: Omit<
      ToastOptions<T>,
      "loadingMessage" | "successMessage" | "errorMessage"
    >
  ) => Promise<T>;
  showSilentToast: <T = unknown>(
    promise: Promise<T>,
    options?: Omit<
      ToastOptions<T>,
      "loadingMessage" | "successMessage" | "errorMessage"
    >
  ) => Promise<T>;
}
