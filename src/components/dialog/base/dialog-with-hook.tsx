"use client";

import { ReactNode } from "react";

import { BaseDialog } from "./base-dialog";
import { useBaseDialog } from "./use-base-dialog";

interface DialogWithHookProps {
  /**
   * اسم الديالوغ (يجب أن يكون فريد)
   */
  dialogName: string;
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
   * حجم الديالوغ
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /**
   * منع الإغلاق عند النقر خارج الديالوغ
   */
  preventCloseOnOutsideClick?: boolean;
}

/**
 * مكون الديالوغ مع الـ hook المدمج
 * يجمع بين useBaseDialog و BaseDialog في مكون واحد
 */
export function DialogWithHook({
  dialogName,
  title,
  children,
  actionButtons,
  size = "md",
  preventCloseOnOutsideClick = false,
}: DialogWithHookProps) {
  const { isOpen, close } = useBaseDialog(dialogName);

  return (
    <BaseDialog
      title={title}
      isOpen={isOpen}
      onClose={close}
      size={size}
      preventCloseOnOutsideClick={preventCloseOnOutsideClick}
      actionButtons={actionButtons}
    >
      {children}
    </BaseDialog>
  );
}
