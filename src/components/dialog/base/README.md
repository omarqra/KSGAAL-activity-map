# Base Dialog Component

مكون الديالوغ الأساسي مع إدارة الحالة عبر URL باستخدام `nuqs`.

## المميزات

- ✅ **تصميم بسيط** - header مع العنوان وزر الإغلاق
- ✅ **إدارة الحالة عبر URL** - حفظ حالة الديالوغ في URL
- ✅ **قابل للتخصيص** - أحجام مختلفة وأزرار إجراءات
- ✅ **Type Safety** - دعم كامل للـ TypeScript
- ✅ **سهولة الاستخدام** - hook مدمج أو منفصل

## الملفات

- `use-base-dialog.tsx` - Hook لإدارة حالة الديالوغ
- `base-dialog.tsx` - مكون الديالوغ الأساسي
- `dialog-with-hook.tsx` - مكون مركب يجمع الـ hook والديالوغ
- `example.tsx` - أمثلة على الاستخدام
- `index.ts` - تصدير جميع المكونات

## الاستخدام

### 1. استخدام DialogWithHook (الأسهل)

```tsx
import { DialogWithHook } from "@/components/common/dialog/base";
import { Button } from "@/components/ui/button";

export function MyComponent() {
  return (
    <div>
      <DialogWithHook
        dialogName="my-dialog"
        title="عنوان الديالوغ"
        size="md"
        actionButtons={
          <>
            <Button variant="outline">إلغاء</Button>
            <Button>حفظ</Button>
          </>
        }
      >
        <p>محتوى الديالوغ</p>
      </DialogWithHook>
    </div>
  );
}
```

### 2. استخدام الـ Hook منفصلاً

```tsx
import { BaseDialog, useBaseDialog } from "@/components/common/dialog/base";
import { Button } from "@/components/ui/button";

export function MyComponent() {
  const { isOpen, open, close, toggle } = useBaseDialog("my-dialog");

  return (
    <div>
      <Button onClick={open}>فتح الديالوغ</Button>

      <BaseDialog
        title="عنوان الديالوغ"
        isOpen={isOpen}
        onClose={close}
        actionButtons={
          <>
            <Button variant="outline" onClick={close}>
              إلغاء
            </Button>
            <Button onClick={close}>حفظ</Button>
          </>
        }
      >
        <p>محتوى الديالوغ</p>
      </BaseDialog>
    </div>
  );
}
```

## API Reference

### useBaseDialog Hook

```tsx
const { isOpen, open, close, toggle } = useBaseDialog(dialogName);
```

#### Parameters

- `dialogName` (string) - اسم فريد للديالوغ

#### Returns

- `isOpen` (boolean) - حالة الديالوغ
- `open` (function) - دالة فتح الديالوغ
- `close` (function) - دالة إغلاق الديالوغ
- `toggle` (function) - دالة تبديل حالة الديالوغ

### BaseDialog Props

| الخاصية                      | النوع                                    | الافتراضي | الوصف                               |
| ---------------------------- | ---------------------------------------- | --------- | ----------------------------------- |
| `title`                      | `string`                                 | -         | عنوان الديالوغ                      |
| `children`                   | `ReactNode`                              | -         | محتوى الديالوغ                      |
| `actionButtons`              | `ReactNode`                              | -         | أزرار الإجراءات                     |
| `isOpen`                     | `boolean`                                | -         | حالة فتح/إغلاق الديالوغ             |
| `onClose`                    | `() => void`                             | -         | دالة إغلاق الديالوغ                 |
| `size`                       | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"`    | حجم الديالوغ                        |
| `preventCloseOnOutsideClick` | `boolean`                                | `false`   | منع الإغلاق عند النقر خارج الديالوغ |

### DialogWithHook Props

| الخاصية                      | النوع                                    | الافتراضي | الوصف                               |
| ---------------------------- | ---------------------------------------- | --------- | ----------------------------------- |
| `dialogName`                 | `string`                                 | -         | اسم فريد للديالوغ                   |
| `title`                      | `string`                                 | -         | عنوان الديالوغ                      |
| `children`                   | `ReactNode`                              | -         | محتوى الديالوغ                      |
| `actionButtons`              | `ReactNode`                              | -         | أزرار الإجراءات                     |
| `size`                       | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"`    | حجم الديالوغ                        |
| `preventCloseOnOutsideClick` | `boolean`                                | `false`   | منع الإغلاق عند النقر خارج الديالوغ |

## أحجام الديالوغ

- `sm` - صغير (max-w-sm)
- `md` - متوسط (max-w-md) - افتراضي
- `lg` - كبير (max-w-lg)
- `xl` - كبير جداً (max-w-xl)
- `full` - كامل العرض (max-w-[95vw])

## أمثلة متقدمة

### ديالوغ مع منع الإغلاق

```tsx
<DialogWithHook
  dialogName="confirmation-dialog"
  title="تأكيد الحذف"
  preventCloseOnOutsideClick={true}
  actionButtons={
    <>
      <Button variant="outline" onClick={close}>
        إلغاء
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        حذف
      </Button>
    </>
  }
>
  <p>هل أنت متأكد من حذف هذا العنصر؟</p>
</DialogWithHook>
```

### ديالوغ كبير مع محتوى معقد

```tsx
<DialogWithHook
  dialogName="form-dialog"
  title="نموذج جديد"
  size="lg"
  actionButtons={
    <>
      <Button variant="outline" onClick={close}>
        إلغاء
      </Button>
      <Button onClick={handleSubmit}>إرسال</Button>
    </>
  }
>
  <div className="space-y-4">
    <div>
      <Label htmlFor="name">الاسم</Label>
      <Input id="name" />
    </div>
    <div>
      <Label htmlFor="email">البريد الإلكتروني</Label>
      <Input id="email" type="email" />
    </div>
    <div>
      <Label htmlFor="message">الرسالة</Label>
      <Textarea id="message" />
    </div>
  </div>
</DialogWithHook>
```

### استخدام متعدد للديالوغات

```tsx
export function MultipleDialogs() {
  const dialog1 = useBaseDialog("dialog-1");
  const dialog2 = useBaseDialog("dialog-2");

  return (
    <div>
      <Button onClick={dialog1.open}>فتح الديالوغ الأول</Button>
      <Button onClick={dialog2.open}>فتح الديالوغ الثاني</Button>

      <BaseDialog
        title="الديالوغ الأول"
        isOpen={dialog1.isOpen}
        onClose={dialog1.close}
      >
        <p>محتوى الديالوغ الأول</p>
      </BaseDialog>

      <BaseDialog
        title="الديالوغ الثاني"
        isOpen={dialog2.isOpen}
        onClose={dialog2.close}
      >
        <p>محتوى الديالوغ الثاني</p>
      </BaseDialog>
    </div>
  );
}
```

## إدارة الحالة عبر URL

الديالوغ يستخدم `nuqs` لحفظ حالته في URL. عندما يكون الديالوغ مفتوحاً، سيظهر في URL كـ:

```
https://yoursite.com/page?dialog=my-dialog
```

هذا يعني:

- ✅ **حفظ الحالة** - عند تحديث الصفحة يبقى الديالوغ مفتوحاً
- ✅ **مشاركة الرابط** - يمكن مشاركة رابط مع ديالوغ مفتوح
- ✅ **التاريخ** - زر الرجوع يغلق الديالوغ

## أفضل الممارسات

1. **استخدم أسماء فريدة** - كل ديالوغ يجب أن يكون له اسم فريد
2. **استخدم DialogWithHook للاستخدام البسيط** - أسهل وأسرع
3. **استخدم الـ hook منفصلاً للتحكم المتقدم** - أكثر مرونة
4. **أضف أزرار إجراءات واضحة** - تجربة مستخدم أفضل
5. **استخدم الأحجام المناسبة** - لا تستخدم `full` إلا عند الحاجة

## استكشاف الأخطاء

### الديالوغ لا يفتح

- تأكد من أن `dialogName` فريد
- تحقق من أن `useBaseDialog` يتم استدعاؤه بشكل صحيح

### الديالوغ لا يغلق

- تأكد من تمرير `onClose` بشكل صحيح
- تحقق من أن `close` function تعمل

### مشاكل في URL

- تأكد من أن `nuqs` مثبت ومُعد بشكل صحيح
- تحقق من أن `parseAsString` يعمل

## الخلاصة

مكون الديالوغ الأساسي يوفر حلاً بسيطاً وقوياً لإدارة الديالوغات مع حفظ الحالة في URL. مناسب لمعظم حالات الاستخدام ويوفر مرونة في التخصيص.
