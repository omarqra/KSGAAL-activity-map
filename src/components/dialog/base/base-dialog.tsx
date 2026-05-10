"use client";

import { ReactNode } from "react";

import { LoaderIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BaseDialogProps {
  /**
   * اظهار اشارة التحميل
   */
  loading?: boolean;
  /**
   * عنوان الديالوغ
   */
  title: string;
  /**
   * محتوى الديالوغ
   */
  children: ReactNode;
  /**
   * أزرار الإجراءات في نهاية الديالوغ
   */
  actionButtons?: ReactNode;
  /**
   * حالة فتح/إغلاق الديالوغ
   */
  isOpen: boolean;
  /**
   * دالة إغلاق الديالوغ
   */
  onClose: () => void;
  /**
   * حجم الديالوغ
   */
  size?: keyof typeof sizeClasses;
  /**
   * منع الإغلاق عند النقر خارج الديالوغ
   */
  preventCloseOnOutsideClick?: boolean;
  /**
   * إخفاء الفواصل بين الأقسام
   */
  hideDividers?: boolean;
  /**
   * وضع ملء الشاشة بالكامل
   */
  fullScreen?: boolean;

  /**
   * اضافة كلاسات من اجل المحتوى ضمن الديالوغ
   */
  contentClassName?: string;

  /**
   * اضافة الديالوغ الى المودال
   */
  model?: boolean;
}
const sizeClasses = {
  sm: "!max-w-sm",
  md: "!max-w-md",
  lg: "!max-w-lg",
  xl: "!max-w-xl",
  "2xl": "!max-w-2xl",
  "3xl": "!max-w-3xl",
  "4xl": "!max-w-4xl",
  "5xl": "!max-w-5xl",
  "6xl": "!max-w-6xl",
  "7xl": "!max-w-7xl",
  full: "!max-w-[95vw]",
};

/**
 * مكون الديالوغ الأساسي مع تصميم بسيط
 * يحتوي على header مع العنوان وزر الإغلاق، content، وأزرار الإجراءات
 */
export function BaseDialog({
  title,
  children,
  actionButtons,
  isOpen,
  onClose,
  size = "md",
  loading = false,
  preventCloseOnOutsideClick = false,
  hideDividers = false,
  fullScreen = false,
  contentClassName = "",
  model = true,
}: BaseDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={model}>
      <DialogContent
        // stop propagation for all events inside the dialog
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onDrag={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn({
          "m-0! flex h-screen! max-h-screen! w-screen! max-w-none! flex-col rounded-none!":
            fullScreen,
          "max-h-screen overflow-auto": !fullScreen,
          [sizeClasses[size]]: !fullScreen,
        })}
        onPointerDownOutside={
          preventCloseOnOutsideClick ? (e) => e.preventDefault() : undefined
        }
      >
        {/* Header */}
        <DialogHeader
          className={`flex flex-row items-center justify-between space-y-0 ${
            !hideDividers ? "border-b pb-4" : "pb-4"
          } ${fullScreen ? "shrink-0" : ""}`}
        >
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div
          className={cn(
            `${
              fullScreen
                ? "max-h-[calc(100vh-215px)] flex-1 overflow-y-auto"
                : "my-4 max-h-[calc(100vh-215px)] min-h-0 flex-1 overflow-y-auto"
            }`,
            contentClassName
          )}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center">
                <LoaderIcon
                  role="status"
                  aria-label="Loading"
                  className={cn("size-5 animate-spin")}
                />
              </div>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Action Buttons */}
        {actionButtons && (
          <div
            className={`flex justify-end gap-2 ${
              !hideDividers ? "border-t pt-4" : "pt-4"
            } ${fullScreen ? "shrink-0" : ""}`}
          >
            {actionButtons}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
