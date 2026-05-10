/**
 * Utility functions for password management and validation
 */

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
  t: (key: string) => string
): PasswordStrength => {
  if (password.length === 0) {
    return { strength: 0, label: "", color: "" };
  }
  if (password.length < 6) {
    return { strength: 25, label: t("Weak"), color: "bg-red-500" };
  }
  if (password.length < 10) {
    return { strength: 50, label: t("Fair"), color: "bg-yellow-500" };
  }
  if (password.length < 14) {
    return { strength: 75, label: t("Good"), color: "bg-blue-500" };
  }
  return { strength: 100, label: t("Strong"), color: "bg-green-500" };
};

/**
 * Validates if passwords match
 */
export const passwordsMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

/**
 * Validates password form before submission
 */
export const validatePasswordForm = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!currentPassword) {
    return { isValid: false, error: "Current password is required" };
  }
  if (!newPassword) {
    return { isValid: false, error: "New password is required" };
  }
  if (newPassword.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters" };
  }
  if (!passwordsMatch(newPassword, confirmPassword)) {
    return { isValid: false, error: "Passwords do not match" };
  }
  return { isValid: true };
};

