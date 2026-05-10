/* eslint-disable @typescript-eslint/no-explicit-any */
import { defaultErrorStrategies, fallbackErrorStrategy } from "./strategies";
import type { ErrorHandlerOptions, ErrorStrategy } from "./types";

// Main error handler class
export class ErrorHandler {
  private strategies: ErrorStrategy[];
  private fallbackStrategy: ErrorStrategy;
  private logErrors: boolean;

  constructor(options: ErrorHandlerOptions = {}) {
    this.strategies = options.strategies || defaultErrorStrategies;
    this.fallbackStrategy = options.fallbackStrategy || fallbackErrorStrategy;
    this.logErrors = options.logErrors ?? true;
  }

  // Handle error with strategies
  async handleError(error: any): Promise<void> {
    if (this.logErrors) {
      console.error("Error occurred:", error);
    }

    // Find the first strategy that can handle this error
    const strategy =
      this.strategies.find((s) => s.canHandle(error)) || this.fallbackStrategy;

    try {
      // Execute the strategy
      await strategy.handle(error);
    } catch (strategyError) {
      // If strategy itself fails, use fallback
      console.error(`Strategy ${strategy.name} failed:`, strategyError);
      await this.fallbackStrategy.handle(error);
    }
  }

  // Add a new strategy
  addStrategy(strategy: ErrorStrategy): void {
    this.strategies.unshift(strategy); // Add to beginning for priority
  }

  // Remove a strategy by name
  removeStrategy(strategyName: string): void {
    this.strategies = this.strategies.filter((s) => s.name !== strategyName);
  }

  // Get all strategies
  getStrategies(): ErrorStrategy[] {
    return [...this.strategies];
  }

  // Clear all strategies
  clearStrategies(): void {
    this.strategies = [];
  }

  // Set fallback strategy
  setFallbackStrategy(strategy: ErrorStrategy): void {
    this.fallbackStrategy = strategy;
  }

  // Get current fallback strategy
  getFallbackStrategy(): ErrorStrategy {
    return this.fallbackStrategy;
  }

  // Check if a strategy exists
  hasStrategy(strategyName: string): boolean {
    return this.strategies.some((s) => s.name === strategyName);
  }

  // Get strategy by name
  getStrategy(strategyName: string): ErrorStrategy | undefined {
    return this.strategies.find((s) => s.name === strategyName);
  }

  // Replace strategy by name
  replaceStrategy(strategyName: string, newStrategy: ErrorStrategy): boolean {
    const index = this.strategies.findIndex((s) => s.name === strategyName);
    if (index !== -1) {
      this.strategies[index] = newStrategy;
      return true;
    }
    return false;
  }

  // Enable/disable error logging
  setLogErrors(enabled: boolean): void {
    this.logErrors = enabled;
  }

  // Get current log errors setting
  getLogErrors(): boolean {
    return this.logErrors;
  }
}
