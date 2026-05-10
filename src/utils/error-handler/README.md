# Error Handler Module

نظام متقدم لمعالجة الأخطاء باستخدام الـ Strategy Pattern، منظم في مجلد منفصل.

## هيكل المجلد

```
src/utils/error-handler/
├── index.ts           # الملف الرئيسي للتصدير
├── types.ts           # أنواع TypeScript
├── strategies.ts      # الـ strategies الافتراضية
├── utils.ts           # دوال مساعدة
├── error-handler.ts   # الـ class الرئيسي
└── README.md          # هذا الملف
```

## الاستخدام الأساسي

```typescript
import { errorHandler, handleError } from "@/utils/error-handler";

// استخدام سريع
try {
  await someApiCall();
} catch (error) {
  await handleError(error);
}

// أو استخدام الـ instance مباشرة
try {
  await someApiCall();
} catch (error) {
  await errorHandler.handleError(error);
}
```

## الملفات والوظائف

### 1. `types.ts` - الأنواع

```typescript
import type { ErrorHandlerOptions, ErrorStrategy } from "@/utils/error-handler";

// إنشاء strategy جديدة
const customStrategy: ErrorStrategy = {
  name: "CustomError",
  canHandle: (error) => error?.code === "CUSTOM_CODE",
  handle: (error) => console.error("Custom error:", error),
};
```

### 2. `strategies.ts` - الـ Strategies الافتراضية

```typescript
import {
  defaultErrorStrategies,
  fallbackErrorStrategy,
} from "@/utils/error-handler";

// استخدام strategies محددة
const customHandler = new ErrorHandler({
  strategies: [defaultErrorStrategies[0], defaultErrorStrategies[2]], // فقط Network و Auth
});

// الـ strategies تستخدم utility functions:
// - createMessagePatternStrategy للـ NetworkError
// - createHttpErrorStrategy للـ HTTP errors (401, 403, 404, 422, 500)
// - createCustomErrorStrategy للـ HttpError و ServerError
// - createErrorTypeStrategy للـ TimeoutError
// - createErrorCodeStrategy للـ error codes
```

### 3. `utils.ts` - دوال مساعدة

```typescript
import {
  createCustomErrorStrategy,
  createHttpErrorStrategy,
  createMessagePatternStrategy,
} from "@/utils/error-handler";

// إنشاء HTTP error strategy
const notFoundStrategy = createHttpErrorStrategy(404, (error) => {
  console.error("Resource not found:", error);
});

// إنشاء strategy مخصصة
const customStrategy = createCustomErrorStrategy(
  "CustomError",
  (error) => error?.code === "CUSTOM_CODE",
  (error) => console.error("Custom error:", error)
);

// إنشاء strategy بناءً على pattern في الرسالة
const networkStrategy = createMessagePatternStrategy(
  "NetworkPattern",
  ["network", "connection", "fetch"],
  (error) => console.error("Network issue:", error)
);
```

### 4. `error-handler.ts` - الـ Class الرئيسي

```typescript
import { ErrorHandler } from "@/utils/error-handler";

// إنشاء handler مخصص
const customHandler = new ErrorHandler({
  strategies: customStrategies,
  fallbackStrategy: customFallback,
  logErrors: false,
});

// إدارة الـ strategies
customHandler.addStrategy(newStrategy);
customHandler.removeStrategy("OldStrategy");
customHandler.replaceStrategy("StrategyName", newStrategy);
```

## أمثلة متقدمة

### إنشاء Custom Error Handler

```typescript
import {
  createErrorHandler,
  createHttpErrorStrategy,
  createMessagePatternStrategy,
} from "@/utils/error-handler";

// إنشاء strategies مخصصة
const customStrategies = [
  createHttpErrorStrategy(404, (error) => {
    router.push("/404");
  }),
  createHttpErrorStrategy(500, (error) => {
    toast.error("Server is down");
  }),
  createMessagePatternStrategy(
    "ValidationPattern",
    ["validation", "invalid"],
    (error) => {
      setValidationErrors(error.data.errors);
    }
  ),
];

// إنشاء handler مخصص
const formErrorHandler = createErrorHandler(customStrategies, {
  logErrors: false,
});

// استخدام في forms
const handleSubmit = async () => {
  try {
    await submitForm(data);
  } catch (error) {
    await formErrorHandler.handleError(error);
  }
};
```

### إضافة Strategies ديناميكياً

```typescript
import { createCustomErrorStrategy, errorHandler } from "@/utils/error-handler";

// إضافة strategy جديدة في runtime
const runtimeStrategy = createCustomErrorStrategy(
  "RuntimeError",
  (error) => error?.source === "runtime",
  (error) => {
    console.error("Runtime error:", error);
    // إعادة تحميل الصفحة
    window.location.reload();
  }
);

errorHandler.addStrategy(runtimeStrategy);
```

### إدارة Strategies حسب السياق

```typescript
import { ErrorHandler, createHttpErrorStrategy } from "@/utils/error-handler";

// Handler للـ API calls
const apiErrorHandler = new ErrorHandler({
  strategies: [
    createHttpErrorStrategy(401, () => {
      // إعادة توجيه للـ login
      window.location.href = "/login";
    }),
    createHttpErrorStrategy(403, () => {
      // عرض رسالة عدم وجود صلاحيات
      toast.error("You don't have permission");
    }),
  ],
});

// Handler للـ form validation
const formErrorHandler = new ErrorHandler({
  strategies: [
    createHttpErrorStrategy(422, (error) => {
      // عرض validation errors
      setFormErrors(error.data.errors);
    }),
  ],
});
```

## المزايا الجديدة

### 1. **تنظيم أفضل**

- كل ملف له مسؤولية محددة
- سهولة الصيانة والتطوير
- فصل واضح للمنطق

### 2. **مرونة أكبر**

- يمكن استيراد أجزاء محددة فقط
- إمكانية إنشاء handlers مخصصة
- دعم أفضل للـ tree shaking

### 3. **أنواع TypeScript محسنة**

- أنواع واضحة ومحددة
- دعم أفضل للـ IntelliSense
- تقليل الأخطاء في وقت التطوير

### 4. **دوال مساعدة متقدمة**

- `createHttpErrorStrategy` - لإنشاء HTTP error strategies
- `createMessagePatternStrategy` - لإنشاء strategies بناءً على patterns
- `createErrorCodeStrategy` - لإنشاء strategies بناءً على error codes
- `createErrorTypeStrategy` - لإنشاء strategies بناءً على error types

### 5. **إدارة متقدمة للـ Strategies**

- إضافة/إزالة strategies ديناميكياً
- استبدال strategies موجودة
- التحقق من وجود strategies
- الحصول على strategies محددة

## التحسينات الجديدة

### استخدام Utility Functions في الـ Default Strategies

الآن جميع الـ default strategies تستخدم utility functions:

```typescript
// NetworkError - يستخدم createMessagePatternStrategy
createMessagePatternStrategy(
  "NetworkError",
  ["network", "fetch", "connection"],
  handler
);

// HTTP Errors - يستخدم createHttpErrorStrategy
createHttpErrorStrategy(401, handler); // Authentication
createHttpErrorStrategy(403, handler); // Permission
createHttpErrorStrategy(404, handler); // Not Found
createHttpErrorStrategy(422, handler); // Validation
createHttpErrorStrategy(500, handler); // Server Error

// Custom Ranges - يستخدم createCustomErrorStrategy
createCustomErrorStrategy("HttpError", canHandle, handler); // 4xx, 5xx
createCustomErrorStrategy("ServerError", canHandle, handler); // 5xx

// Error Types - يستخدم createErrorTypeStrategy
createErrorTypeStrategy("TimeoutError", "TimeoutError", handler);

// Error Codes - يستخدم createErrorCodeStrategy
createErrorCodeStrategy(
  "UNAUTHORIZED",
  ["UNAUTHORIZED", "AUTH_FAILED"],
  handler
);
createErrorCodeStrategy(
  "VALIDATION_ERROR",
  ["VALIDATION_ERROR", "INVALID_DATA"],
  handler
);
```

### المزايا

1. **كود أكثر تنظيماً** - استخدام utility functions بدلاً من objects مباشرة
2. **سهولة الصيانة** - تغيير logic في مكان واحد
3. **اتساق أفضل** - جميع strategies تتبع نفس النمط
4. **قابلية التوسع** - سهولة إضافة strategies جديدة
5. **اختبار أسهل** - يمكن اختبار utility functions منفصلة

## أفضل الممارسات

1. **استخدم الملفات المناسبة** - استورد فقط ما تحتاجه
2. **أنشئ handlers مخصصة** للمجالات المختلفة
3. **استخدم utility functions** لإنشاء strategies شائعة
4. **اختبر strategies** بشكل منفصل
5. **رتب strategies** حسب الأولوية
6. **استخدم types** للحصول على type safety أفضل
7. **استخدم utility functions** بدلاً من إنشاء strategies يدوياً
