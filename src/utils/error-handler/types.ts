/* eslint-disable @typescript-eslint/no-explicit-any */
// Error Handler Types
export interface ErrorStrategy {
  name: string;
  canHandle: (error: any) => boolean;
  handle: (error: any) => void | Promise<void>;
}

export interface ErrorHandlerOptions {
  strategies?: ErrorStrategy[];
  fallbackStrategy?: ErrorStrategy;
  logErrors?: boolean;
}

// Common error types for better type safety
export interface ApiError {
  status?: number;
  message?: string;
  code?: string;
  data?: any;
  response?: {
    status: number;
    data: any;
  };
}

export interface NetworkError extends ApiError {
  name: "NetworkError";
}

export interface HttpError extends ApiError {
  status: number;
}

export interface ValidationError extends ApiError {
  name: "ValidationError";
  errors?: Record<string, string[]>;
}

export interface AuthError extends ApiError {
  status: 401;
}

export interface PermissionError extends ApiError {
  status: 403;
}

export interface ServerError extends ApiError {
  status: number; // 5xx
}

export interface TimeoutError extends ApiError {
  name: "TimeoutError";
  code: "TIMEOUT";
}
