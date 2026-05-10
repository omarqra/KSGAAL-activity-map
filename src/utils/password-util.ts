import { Messages, _Translator } from "next-intl";

export interface PasswordStrength {
  strength: number;
  label: string;
  color: string;
}

/**
 * Calculates password strength based on length
 * Returns strength percentage, label, and color for UI
 */
export const calculatePasswordStrength = (
  password: string,
  t: _Translator<Messages>
): PasswordStrength => {
  if (!password) {
    return { strength: 0, label: "", color: "" };
  }

  let score = 0;

  // 1️⃣ Length (max 40)
  const lengthScore = Math.min(password.length * 4, 40);
  score += lengthScore;

  // 2️⃣ Character variety (max 40)
  const checks = [
    /[a-z]/.test(password), // lowercase
    /[A-Z]/.test(password), // uppercase
    /\d/.test(password), // numbers
    /[^A-Za-z0-9]/.test(password), // symbols
  ];

  score += checks.filter(Boolean).length * 10;

  // 3️⃣ Penalties (max -30)
  if (/^(.)\1+$/.test(password)) score -= 30; // all same char
  if (/123|abc|qwerty/i.test(password)) score -= 20;

  // Clamp score
  score = Math.max(0, Math.min(score, 100));

  // 4️⃣ Map score → UI
  if (score < 30) {
    return { strength: score, label: t("Weak"), color: "bg-red-500" };
  }
  if (score < 60) {
    return { strength: score, label: t("Fair"), color: "bg-yellow-500" };
  }
  if (score < 80) {
    return { strength: score, label: t("Good"), color: "bg-blue-500" };
  }

  return { strength: score, label: t("Strong"), color: "bg-green-500" };
};
