"use client";

import { ReactNode } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Trash2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmType = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  /**
   * عنوان الديالوغ
   */
  title?: string;
  /**
   * رسالة التأكيد
   */
  message: string | ReactNode;
  /**
   * نوع التأكيد (يحدد الألوان والأيقونة)
   */
  type?: ConfirmType;
  /**
   * نص زر التأكيد
   */
  confirmText?: string;
  /**
   * نص زر الإلغاء
   */
  cancelText?: string;
  /**
   * حالة فتح/إغلاق الديالوغ
   */
  isOpen: boolean;
  /**
   * دالة التأكيد
   */
  onConfirm: () => void | Promise<void>;
  /**
   * دالة الإلغاء
   */
  onCancel?: () => void;
  /**
   * حالة التحميل
   */
  isLoading?: boolean;
  /**
   * منع الإغلاق عند النقر خارج الديالوغ
   */
  preventCloseOnOutsideClick?: boolean;
  /**
   * محتوى مخصص بدلاً من الرسالة الافتراضية
   */
  children?: ReactNode;
  /**
   * أزرار مخصصة بدلاً من الأزرار الافتراضية
   */
  customButtons?: ReactNode;
}

const typeConfig = {
  danger: {
    icon: Trash2,
    iconWrap:
      "bg-brand-wine/[0.08] text-brand-wine ring-8 ring-brand-wine/[0.06]",
    confirmBtn: "bg-brand-wine hover:bg-brand-wine/90 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap:
      "bg-brand-yellow/[0.18] text-brand-yellow ring-8 ring-brand-yellow/[0.12]",
    confirmBtn:
      "bg-brand-yellow hover:bg-brand-yellow/90 text-brand-greenDeep",
  },
  info: {
    icon: Info,
    iconWrap:
      "bg-brand-blue/[0.08] text-brand-blue ring-8 ring-brand-blue/[0.06]",
    confirmBtn: "bg-brand-blue hover:bg-brand-blue/90 text-white",
  },
  success: {
    icon: CheckCircle2,
    iconWrap:
      "bg-brand-green/[0.08] text-brand-green ring-8 ring-brand-green/[0.06]",
    confirmBtn: "bg-brand-green hover:bg-brand-greenDeep text-white",
  },
} as const;

export function ConfirmDialog({
  title,
  message,
  type = "warning",
  confirmText,
  cancelText,
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
  preventCloseOnOutsideClick = false,
  children,
  customButtons,
}: ConfirmDialogProps) {
  const config = typeConfig[type];
  const IconComponent = config.icon;

  const handleConfirm = async () => {
    if (!isLoading) await onConfirm();
  };

  const handleCancel = () => {
    if (!isLoading) onCancel?.();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={
          preventCloseOnOutsideClick ? (e) => e.preventDefault() : undefined
        }
        onEscapeKeyDown={
          preventCloseOnOutsideClick ? (e) => e.preventDefault() : undefined
        }
        className="max-w-100 gap-0 rounded-xl border-0 p-0 shadow-xl"
      >
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              config.iconWrap
            )}
          >
            <IconComponent
              className="h-6 w-6"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>

          <DialogTitle className="text-aws-text mt-5 text-[16px] leading-tight font-semibold">
            {title}
          </DialogTitle>

          {typeof message === "string" ? (
            <DialogDescription className="text-aws-text2 mt-2 max-w-[320px] text-[13px] leading-relaxed">
              {message}
            </DialogDescription>
          ) : (
            <div className="text-aws-text2 mt-2 max-w-[320px] text-[13px] leading-relaxed">
              {message}
            </div>
          )}

          {children}
        </div>

        <div className="border-aws-border2 flex gap-2 border-t px-5 py-3.5">
          {customButtons || (
            <>
              <Button
                variant="default"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 justify-center"
              >
                {cancelText}
              </Button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className={cn(
                  "btn flex-1 justify-center border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  config.confirmBtn
                )}
              >
                {isLoading && (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {confirmText}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
