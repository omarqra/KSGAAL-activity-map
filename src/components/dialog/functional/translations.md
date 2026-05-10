# Confirm Dialog Translation Keys

The following translation keys need to be added to your translation files (`src/messages/ar.json` and `src/messages/en.json`):

## Arabic Translations (ar.json)

```json
{
  "confirm": {
    "delete": {
      "title": "تأكيد الحذف",
      "message": "هل أنت متأكد من حذف هذا العنصر؟",
      "confirmText": "حذف"
    },
    "warning": {
      "title": "تحذير",
      "message": "هل تريد المتابعة؟",
      "confirmText": "متابعة"
    },
    "info": {
      "title": "معلومات",
      "message": "معلومات مهمة",
      "confirmText": "موافق"
    },
    "success": {
      "title": "نجح",
      "message": "تمت العملية بنجاح",
      "confirmText": "موافق"
    },
    "cancelText": "إلغاء",
    "loading": "جاري..."
  }
}
```

## English Translations (en.json)

```json
{
  "confirm": {
    "delete": {
      "title": "Confirm Delete",
      "message": "Are you sure you want to delete this item?",
      "confirmText": "Delete"
    },
    "warning": {
      "title": "Warning",
      "message": "Do you want to continue?",
      "confirmText": "Continue"
    },
    "info": {
      "title": "Information",
      "message": "Important information",
      "confirmText": "OK"
    },
    "success": {
      "title": "Success",
      "message": "Operation completed successfully",
      "confirmText": "OK"
    },
    "cancelText": "Cancel",
    "loading": "Loading..."
  }
}
```

## Usage Notes

1. **Translation Keys Structure**: All keys are nested under `confirm` for better organization
2. **Type-specific Keys**: Each confirm type (danger, warning, info, success) has its own title, message, and confirmText
3. **Shared Keys**: `cancelText` and `loading` are shared across all types
4. **Customization**: You can override any of these keys by passing custom text to the component props

## Example Usage with Translation

```tsx
import { useTranslations } from "next-intl";

// or your translation hook

const t = useTranslations("confirm");

<ConfirmDialog
  title={t("delete.title")}
  message={t("delete.message")}
  confirmText={t("delete.confirmText")}
  cancelText={t("cancelText")}
  // ... other props
/>;
```

