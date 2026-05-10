"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import { ConfirmDialog, type ConfirmType } from "../functional/confirm-dialog";

export interface ConfirmOptions {
  title?: string;
  message: string | ReactNode;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
  loadingText?: string;
  preventCloseOnOutsideClick?: boolean;
}

interface ConfirmDialogState {
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  isLoading: boolean;
}

interface ConfirmDialogContextType {
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<
  ConfirmDialogContextType | undefined
>(undefined);

export const ConfirmDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, setState] = useState<ConfirmDialogState>({
    options: null,
    resolve: null,
    isLoading: false,
  });

  const openConfirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve, isLoading: false });
    });
  }, []);

  const handleConfirm = async () => {
    if (!state.options) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // تنفيذ onConfirm إذا كان موجود
      if (state.options.onConfirm) {
        await state.options.onConfirm();
      }

      // إغلاق الديالوغ مع نتيجة true
      if (state.resolve) state.resolve(true);
      setState({ options: null, resolve: null, isLoading: false });
    } catch (error) {
      console.error("Error in confirm action:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancel = () => {
    if (!state.options) return;

    // تنفيذ onCancel إذا كان موجود
    if (state.options.onCancel) {
      state.options.onCancel();
    }

    // إغلاق الديالوغ مع نتيجة false
    if (state.resolve) state.resolve(false);
    setState({ options: null, resolve: null, isLoading: false });
  };

  return (
    <ConfirmDialogContext.Provider value={{ openConfirm }}>
      {children}
      {state.options && (
        <ConfirmDialog
          title={state.options.title}
          message={state.options.message}
          type={state.options.type}
          confirmText={state.options.confirmText}
          cancelText={state.options.cancelText}
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={state.isLoading}
          preventCloseOnOutsideClick={state.options.preventCloseOnOutsideClick}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
};

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error(
      "useConfirmDialog must be used within ConfirmDialogProvider"
    );
  }
  return ctx.openConfirm;
}

// Type helper for better DX
export type ConfirmDialog = (options: ConfirmOptions) => Promise<boolean>;
