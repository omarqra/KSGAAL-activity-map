"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import { Control, FieldValues, useController } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import FieldLabel from "../FormBuilder/components/field-label";
import { Card, CardContent } from "./card";

interface LanguageFieldInputProps {
  name: string;
  control: Control<FieldValues>;
  label?: string;
  className?: string;
  enPlaceholder?: string;
  arPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  LabelComponent?: (props: { htmlFor: string | number }) => React.ReactNode;
}

export function LanguageFieldInput({
  name,
  control,
  label,
  className,
  enPlaceholder = "Enter English value",
  arPlaceholder = "أدخل القيمة العربية",
  disabled = false,
  required = false,
  LabelComponent,
}: LanguageFieldInputProps) {
  const t = useTranslations();
  const id = `language-input-${name}`;
  const [activeTab, setActiveTab] = useState<"en" | "ar">("en");

  const enInputRef = useRef<HTMLInputElement>(null);
  const arInputRef = useRef<HTMLInputElement>(null);
  const previousEnError = useRef<string | undefined>(undefined);
  const previousArError = useRef<string | undefined>(undefined);

  const {
    field: enField,
    fieldState: { error: enError },
  } = useController({
    name: `${name}.en`,
    control,
  });

  const {
    field: arField,
    fieldState: { error: arError },
  } = useController({
    name: `${name}.ar`,
    control,
  });

  // Auto-switch to error tab and focus when new error appears
  useEffect(() => {
    const newEnError = enError?.message;
    const newArError = arError?.message;

    // English error just appeared
    if (newEnError && !previousEnError.current) {
      setTimeout(() => {
        setActiveTab("en");
      }, 0);
      setTimeout(() => {
        enInputRef.current?.focus();
        enInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
    // Arabic error just appeared (and no English error)
    else if (newArError && !previousArError.current && !newEnError) {
      setTimeout(() => {
        setActiveTab("ar");
      }, 0);
      setTimeout(() => {
        arInputRef.current?.focus();
        arInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }

    previousEnError.current = newEnError;
    previousArError.current = newArError;
  }, [enError?.message, arError?.message]);

  return (
    <div className={className}>
      <Card>
        <CardContent>
          {label && (
            <FieldLabel
              LabelComponent={LabelComponent}
              htmlFor={`${id}-en`}
              label={label}
              required={required}
            />
          )}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (value === "en" || value === "ar") {
                setActiveTab(value);
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="en"
                className={enError ? "border-destructive border-2" : ""}
              >
                {t("common.english")} {enError && "⚠️"}
              </TabsTrigger>
              <TabsTrigger
                value="ar"
                className={arError ? "border-destructive border-2" : ""}
              >
                {t("common.arabic")} {arError && "⚠️"}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-3">
              <Input
                id={`${id}-en`}
                ref={(node) => {
                  // Combine both refs
                  enInputRef.current = node;
                  enField.ref(node);
                }}
                value={enField.value ?? ""}
                onChange={(e) => enField.onChange(e.target.value)}
                onBlur={enField.onBlur}
                placeholder={enPlaceholder}
                disabled={disabled}
                dir="ltr"
                className="w-full"
                aria-invalid={!!enError}
              />
              {enError?.message && (
                <p className="text-destructive mt-1 text-sm">
                  {enError.message}
                </p>
              )}
            </TabsContent>
            <TabsContent value="ar" className="mt-3">
              <Input
                id={`${id}-ar`}
                ref={(node) => {
                  // Combine both refs
                  arInputRef.current = node;
                  arField.ref(node);
                }}
                value={arField.value ?? ""}
                onChange={(e) => arField.onChange(e.target.value)}
                onBlur={arField.onBlur}
                placeholder={arPlaceholder}
                disabled={disabled}
                dir="rtl"
                className="w-full"
                aria-invalid={!!arError}
              />
              {arError?.message && (
                <p className="text-destructive mt-1 text-sm">
                  {arError.message}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
