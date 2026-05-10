/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ErrorStrategy } from "./types";

// Utility functions for common error patterns
export const createHttpErrorStrategy = (
  statusCode: number,
  customHandler?: (error: any) => void
): ErrorStrategy => ({
  name: `HttpError${statusCode}`,
  canHandle: (error: any) => {
    return (
      error?.status === statusCode ||
      error?.response?.status === statusCode ||
      error?.data?.status === statusCode
    );
  },
  handle:
    customHandler ||
    ((error: any) => {
      console.error(`HTTP ${statusCode} Error:`, error);
    }),
});

export const createCustomErrorStrategy = (
  name: string,
  canHandle: (error: any) => boolean,
  handle: (error: any) => void | Promise<void>
): ErrorStrategy => ({
  name,
  canHandle,
  handle,
});

// Utility function to create multiple HTTP error strategies
export const createHttpErrorStrategies = (
  statusCodes: number[],
  customHandler?: (error: any) => void
): ErrorStrategy[] => {
  return statusCodes.map((code) =>
    createHttpErrorStrategy(code, customHandler)
  );
};

// Utility function to create a strategy based on error message pattern
export const createMessagePatternStrategy = (
  name: string,
  patterns: string[],
  handler: (error: any) => void | Promise<void>
): ErrorStrategy => ({
  name,
  canHandle: (error: any) => {
    const message = error?.message?.toLowerCase() || "";
    return patterns.some((pattern) => message.includes(pattern.toLowerCase()));
  },
  handle: handler,
});

// Utility function to create a strategy based on error code
export const createErrorCodeStrategy = (
  name: string,
  codes: string[],
  handler: (error: any) => void | Promise<void>
): ErrorStrategy => ({
  name,
  canHandle: (error: any) => {
    const code = error?.code || "";
    return codes.includes(code);
  },
  handle: handler,
});

// Utility function to create a strategy for specific error types
export const createErrorTypeStrategy = (
  name: string,
  errorType: string,
  handler: (error: any) => void | Promise<void>
): ErrorStrategy => ({
  name,
  canHandle: (error: any) => {
    return error?.name === errorType || error?.constructor?.name === errorType;
  },
  handle: handler,
});
