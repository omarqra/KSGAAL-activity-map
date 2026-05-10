/* eslint-disable @typescript-eslint/no-explicit-any */
// Import everything first
import { ErrorHandler } from "./error-handler";
import type { ErrorHandlerOptions, ErrorStrategy } from "./types";

// Main exports
export { ErrorHandler } from "./error-handler";
export { defaultErrorStrategies, fallbackErrorStrategy } from "./strategies";
export {
  createCustomErrorStrategy,
  createErrorCodeStrategy,
  createErrorTypeStrategy,
  createHttpErrorStrategies,
  createHttpErrorStrategy,
  createMessagePatternStrategy,
} from "./utils";

// Type exports
export type {
  ApiError,
  AuthError,
  ErrorHandlerOptions,
  ErrorStrategy,
  HttpError,
  NetworkError,
  PermissionError,
  ServerError,
  TimeoutError,
  ValidationError,
} from "./types";

// Default error handler instance
export const errorHandler = new ErrorHandler();

// Convenience function for quick error handling
export const handleError = async (error: any): Promise<void> => {
  await errorHandler.handleError(error);
};

// Create custom error handler with specific strategies
export const createErrorHandler = (
  strategies: ErrorStrategy[],
  options?: Partial<ErrorHandlerOptions>
): ErrorHandler => {
  return new ErrorHandler({
    strategies,
    ...options,
  });
};
