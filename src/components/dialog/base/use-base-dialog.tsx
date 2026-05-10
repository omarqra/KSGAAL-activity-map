import { useCallback, useMemo } from "react";

import { parseAsString, useQueryState } from "nuqs";

/**
 * Hook لإدارة حالة الديالوغ باستخدام URL state
 * @param dialogName اسم الديالوغ (يجب أن يكون فريد)
 * @returns object يحتوي على حالة الديالوغ ودوال التحكم
 */
export function useBaseDialog(dialogName: string) {
  const [openDialog, setOpenDialog] = useQueryState(
    "dialog",
    parseAsString.withDefault("")
  );

  // التحقق من أن الديالوغ مفتوح
  const isOpen = useMemo(
    () => openDialog.split(",").includes(dialogName),
    [openDialog, dialogName]
  );

  // فتح الديالوغ
  const open = useCallback(() => {
    if (openDialog.split(",").includes(dialogName)) return;
    setOpenDialog(`${openDialog}${openDialog ? "," : ""}${dialogName}`);
  }, [dialogName, openDialog, setOpenDialog]);

  // إغلاق الديالوغ
  const close = useCallback(() => {
    const filteredQueryString = openDialog.replace(`${dialogName}`, "");
    if (filteredQueryString === ",") {
      setOpenDialog("");
      return;
    } else {
      setOpenDialog(filteredQueryString.replace(",,", ""));
    }
  }, [dialogName, openDialog, setOpenDialog]);

  // تبديل حالة الديالوغ
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Hook لإدارة حالة الديالوغ باستخدام URL state و regex
 * @param dialogName regex للديالوغ (يجب أن يكون فريد)
 * @returns object يحتوي على حالة الديالوغ ودوال التحكم
 */
export function useBaseDialogRegex(dialogName: RegExp) {
  const [openDialog, setOpenDialog] = useQueryState(
    "dialog",
    parseAsString.withDefault("")
  );

  // التحقق من أن الديالوغ مفتوح
  const isOpen = useMemo(() => {
    return openDialog.split(",").some((dialog) => dialogName.test(dialog));
  }, [openDialog, dialogName]);

  // فتح الديالوغ
  const open = useCallback(
    (openDialogKey: string) => {
      if (isOpen) return;
      setOpenDialog(`${openDialog}${openDialog ? "," : ""}${openDialogKey}`);
    },
    [isOpen, openDialog, setOpenDialog]
  );

  // إغلاق الديالوغ
  const close = useCallback(() => {
    const filteredQueryString = openDialog
      .split(",")
      .filter((dialog) => !dialogName.test(dialog))
      .join(",");
    if (filteredQueryString === ",") {
      setOpenDialog("");
      return;
    } else {
      setOpenDialog(filteredQueryString.replace(",,", ""));
    }
  }, [dialogName, openDialog, setOpenDialog]);

  const openDialogKey = useMemo(() => {
    return openDialog.split(",").find((dialog) => dialogName.test(dialog));
  }, [openDialog, dialogName]);

  return {
    isOpen,
    open,
    close,
    openDialogKey,
  };
}
export function useBaseDialogRegexHelper({ regex_key }: { regex_key: string }) {
  const regex = useMemo(() => {
    const _regex_string = `^${regex_key}-([a-zA-Z0-9._-]+)$`;
    return new RegExp(_regex_string);
  }, [regex_key]);
  const baseDialog = useBaseDialogRegex(regex);
  const { id, key } = useMemo(() => {
    const matchResult = baseDialog.openDialogKey
      ? baseDialog.openDialogKey.match(regex)
      : null;

    const extracted_id_string = matchResult?.[1];

    if (typeof extracted_id_string === "string") {
      if (/^\d+$/.test(extracted_id_string)) {
        const parsed = parseInt(extracted_id_string, 10);
        return {
          id: parsed,
          key: null,
        };
      }
      return {
        key: extracted_id_string,
        id: null,
      };
    }

    return {
      id: null,
      key: null,
    };
  }, [baseDialog.openDialogKey, regex]);

  return {
    id,
    key,
    open: (_id: number | string) => baseDialog.open(`${regex_key}-${_id}`),
    baseDialog,
    regex,
  };
}
