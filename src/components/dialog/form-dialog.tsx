/* eslint-disable max-lines */
"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "next-intl";
import { FieldValues, UseFormProps } from "react-hook-form";

// استيراد الأنواع من FormBuilder
import {
  ExtractZodInfer,
  Field,
  FormBuilder,
  FormFields,
  useFormBuilder,
} from "@/components/FormBuilder";
import { Button } from "@/components/ui/button";

import { useBaseDialog } from "./base";
import { BaseDialog } from "./base/base-dialog";
import { useBaseDialogRegex } from "./base/use-base-dialog";

// ============================================================================
// TYPES
// ============================================================================

interface FormDialogOptions<T extends FieldValues> {
  /**
   * دالة الإرسال
   */
  onSubmit: (data: T) => void | Promise<void>;
  /**
   * عنوان الديالوغ
   */
  title?: string;
  /**
   * نص زر الإرسال
   */
  submitText?: string;
  /**
   * نص زر الإلغاء
   */
  cancelText?: string;
  /**
   * حجم الديالوغ
   */
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "full";
  /**
   * خيارات إضافية لـ useFormBuilder
   */
  formOptions?: Omit<UseFormProps<T>, "resolver">;
}

interface FormDialogProps<T extends FormFields> {
  /**
   * الحقول المدمجة مع prepareFields
   */
  fields: T;
  /**
   * خيارات الديالوغ
   */
  options: FormDialogOptions<{
    [K in keyof ExtractZodInfer<T>]: ExtractZodInfer<T>[K];
  }>;
  /**
   * القيم الافتراضية للنموذج
   */
  resetOnOpen?: boolean;
  /**
   * حالة فتح/إغلاق الديالوغ
   */
  isOpen: boolean;
  /**
   * دالة إغلاق الديالوغ
   */
  onClose: () => void;
  /**
   * وضع ملء الشاشة
   */
  fullScreen?: boolean;
  /**
   * إخفاء الفواصل
   */
  hideDividers?: boolean;
  /**
   * منع الإغلاق عند النقر خارج الديالوغ
   */
  preventCloseOnOutsideClick?: boolean;
  /**
   * محتوى مخصص قبل النموذج
   */
  beforeForm?: ReactNode;
  /**
   * محتوى مخصص بعد النموذج
   */
  afterForm?: ReactNode;
  /**
   * class name للنموذج
   */
  formClassName?: string;
  /**
   * أزرار مخصصة بدلاً من الأزرار الافتراضية
   */
  customButtons?: ReactNode;
  /**
   * تفعيل أدوات التطوير
   */
  enableDevTools?: boolean;
  /**
   * اضافة الديالوغ الى المودال
   */
  model?: boolean;
}

// ============================================================================
// FORM DIALOG COMPONENT
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormDialog<T extends Record<string, Field<any>>>({
  fields,
  options,
  isOpen,
  onClose,
  fullScreen = false,
  hideDividers = false,
  preventCloseOnOutsideClick = false,
  beforeForm,
  afterForm,
  formClassName = "grid grid-cols-12 gap-4",
  customButtons,
  enableDevTools = false,
  resetOnOpen = true,
  model = true,
}: FormDialogProps<T>) {
  const t = useTranslations();
  const {
    onSubmit,
    title: defaultTitle = t("Form"),
    submitText: defaultSubmitText = t("Save"),
    cancelText: defaultCancelText = t("Cancel"),
    size: defaultSize = "md",
    formOptions = {},
  } = options;

  formOptions.mode = formOptions.mode || "all";

  // إدارة حالة الديالوغ
  const [currentTitle, setCurrentTitle] = useState(defaultTitle);
  const [currentSubmitText, setCurrentSubmitText] = useState(defaultSubmitText);
  const [currentCancelText, setCurrentCancelText] = useState(defaultCancelText);
  const [currentSize, setCurrentSize] = useState(defaultSize);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // إعداد FormBuilder داخلياً
  const formHooks = useFormBuilder(fields, {
    ...formOptions,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // إعادة تعيين النموذج عند فتح الديالوغ
  useEffect(() => {
    if (isOpen) {
      setCurrentTitle(defaultTitle);
      setCurrentSubmitText(defaultSubmitText);
      if (
        resetOnOpen &&
        formOptions.defaultValues &&
        !(formOptions.defaultValues instanceof Promise) &&
        typeof formOptions.defaultValues === "object"
      ) {
        formHooks.reset(formOptions.defaultValues);
      } else if (formOptions.defaultValues instanceof Promise) {
        setIsLoading(true);
        formOptions.defaultValues.then((values) => {
          formHooks.reset(values);
          setIsLoading(false);
        });
      }
      setCurrentCancelText(defaultCancelText);
      setCurrentSize(defaultSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const data = formHooks.getValues();
      const isValid = await formHooks.trigger();
      if (isValid) {
        await onSubmit(data);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formHooks, onSubmit]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const defaultButtons = useMemo(
    () => (
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
          {currentCancelText}
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : currentSubmitText}
        </Button>
      </div>
    ),
    [
      currentCancelText,
      currentSubmitText,
      handleClose,
      handleSubmit,
      isSubmitting,
    ]
  );

  return (
    <BaseDialog
      title={currentTitle}
      isOpen={isOpen}
      onClose={handleClose}
      size={currentSize}
      fullScreen={fullScreen}
      model={model}
      loading={isLoading}
      hideDividers={hideDividers}
      preventCloseOnOutsideClick={preventCloseOnOutsideClick}
      actionButtons={customButtons || defaultButtons}
    >
      {beforeForm && <div className="mb-4">{beforeForm}</div>}
      <div className={formClassName}>
        <FormBuilder
          fields={fields}
          FormHooks={formHooks}
          containerClassName="col-span-12 overflow-y-hidden"
          enableDevTools={enableDevTools}
        />
      </div>
      {afterForm && <div className="mt-4">{afterForm}</div>}
    </BaseDialog>
  );
}

// ============================================================================
// USE FORM DIALOG HOOK
// ============================================================================

export function useFormDialog<T extends FormFields>(
  dialogName: string,
  fields: T,
  options: FormDialogOptions<{
    [K in keyof ExtractZodInfer<T>]: ExtractZodInfer<T>[K];
  }>
) {
  const {
    close: dialogClose,
    isOpen,
    open: setIsOpen,
  } = useBaseDialog(dialogName);
  const [pendingData, setPendingData] = useState<Partial<
    ExtractZodInfer<T>
  > | null>(null);

  const open = (data?: Partial<ExtractZodInfer<T>>) => {
    if (data) {
      // تحويل البيانات الجزئية إلى كاملة
      setPendingData(data);
    } else {
      setPendingData(null);
    }
    setIsOpen();
  };

  const close = () => {
    dialogClose();
    setPendingData(null);
  };

  const reset = () => {
    setIsOpen();
    setPendingData(null);
  };

  // تجميع جميع البيانات المطلوبة للـ FormDialog
  const dialogProps = {
    fields,
    options,
    isOpen,
    onClose: close,
  };

  return {
    // حالة الديالوغ
    isOpen,

    // النصوص
    title: options.title || "نموذج",
    submitText: options.submitText || "حفظ",
    cancelText: options.cancelText || "إلغاء",
    size: options.size || "md",

    // الدوال
    open,
    close,
    reset,

    // دالة الإرسال المحسنة
    onSubmit: options.onSubmit,

    // القيم الافتراضية الحالية
    defaultValues: pendingData || options.formOptions?.defaultValues || {},

    // خيارات النموذج
    formOptions: options.formOptions || {},

    // تجميع البيانات للـ FormDialog
    dialogProps,
  };
}

export function useFormDialogRegex<T extends FormFields>(
  dialogName: {
    regex: RegExp;
    name: string;
  },
  fields: T,
  options: FormDialogOptions<{
    [K in keyof ExtractZodInfer<T>]: ExtractZodInfer<T>[K];
  }>
) {
  const {
    close: dialogClose,
    isOpen,
    open: setIsOpen,
    openDialogKey,
  } = useBaseDialogRegex(dialogName.regex);
  const [pendingData, setPendingData] = useState<Partial<
    ExtractZodInfer<T>
  > | null>(null);

  const open = (data?: Partial<ExtractZodInfer<T>>) => {
    if (data) {
      // تحويل البيانات الجزئية إلى كاملة
      setPendingData(data);
    } else {
      setPendingData(null);
    }
    setIsOpen(dialogName.name);
  };

  const close = () => {
    dialogClose();
    setPendingData(null);
  };

  const reset = () => {
    setIsOpen(dialogName.name);
    setPendingData(null);
  };

  // تجميع جميع البيانات المطلوبة للـ FormDialog
  const dialogProps = {
    fields,
    options,
    isOpen,
    onClose: close,
  };

  return {
    // حالة الديالوغ
    isOpen,

    // النصوص
    title: options.title || "نموذج",
    submitText: options.submitText || "حفظ",
    cancelText: options.cancelText || "إلغاء",
    size: options.size || "md",

    // الدوال
    open,
    close,
    reset,
    openDialogKey,

    // دالة الإرسال المحسنة
    onSubmit: options.onSubmit,

    // القيم الافتراضية الحالية
    defaultValues: pendingData || options.formOptions?.defaultValues || {},

    // خيارات النموذج
    formOptions: options.formOptions || {},

    // تجميع البيانات للـ FormDialog
    dialogProps,
  };
}
