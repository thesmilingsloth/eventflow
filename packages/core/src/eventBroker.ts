import { createLoggerMiddleware } from "./middlewares/logger";
import {
  DEFAULT_MAX_LISTENERS,
  DEFAULT_ERROR_POLICY,
  POLICY,
  ErrorType,
  ERROR_TYPE,
  Policy,
  ErrorHandler,
} from "./types";
import type {
  EventEmitter,
  EventBrokerOptions,
  EventMap,
  Middleware,
  Unsubscribe,
  ErrorPolicy,
  Event,
  EventListener,
} from "./types";

/**
 * Implementation of the EventEmitter interface that provides a type-safe event broker
 * with middleware support and configurable error handling.
 *
 * @template T - The event map type that defines the events and their data types
 * @implements {EventEmitter<T>}
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   'user:login': { userId: string };
 *   'notification:show': { message: string };
 * }
 *
 * const broker = new EventBroker<MyEvents>();
 * ```
 */
export class EventBroker<T extends EventMap> implements EventEmitter<T> {
  private listeners: Map<keyof T, Set<EventListener<T, keyof T>>> = new Map();
  private middlewares: Set<Middleware<T>>;
  private errorPolicy: ErrorPolicy<T>;
  private maxListeners: number;

  /**
   * Creates a new EventBroker instance
   * @param options - Configuration options for the event broker
   */
  constructor(options: EventBrokerOptions<T> = {}) {
    const middlewares = options.middlewares || [];

    if (options.logger) {
      middlewares.push(createLoggerMiddleware({ console: true }));
    }

    this.middlewares = new Set(middlewares || []);
    this.errorPolicy = options.errorPolicy || DEFAULT_ERROR_POLICY;
    this.maxListeners = options.maxListeners || DEFAULT_MAX_LISTENERS;
  }

  /**
   * Gets the error handling strategy based on the provided policy
   * @private
   * @param policy - The error handling policy or custom handler
   * @returns A function that implements the error handling strategy
   */
  private getErrorHandlingStrategy(
    policy: Policy | ErrorHandler<T>
  ): (
    error: Error,
    event: { name: keyof T; data: T[keyof T] },
    type: ErrorType
  ) => boolean {
    if (typeof policy === "function") {
      return (error, event) => {
        policy(error, event);

        return true; // Continue execution
      };
    }

    if (policy === POLICY.CONTINUE) {
      return (error, event, type) => {
        console.error(
          `EventFlow error: Error in event ${type} for ${String(event.name)}:`,
          error
        );

        return true; // Continue execution
      };
    }

    if (policy === POLICY.STOP) {
      return (error) => {
        throw error; // Stop execution
      };
    }

    return () => true; // Default to continue
  }

  /**
   * Handles errors that occur during event processing
   * @private
   * @param error - The error that occurred
   * @param event - The event that caused the error
   * @param type - The type of error that occurred
   * @returns Whether to continue execution
   */
  private handleError(
    error: Error,
    event: { name: keyof T; data: T[keyof T] },
    type: ErrorType
  ): boolean {
    const policy_map = {
      [ERROR_TYPE.LISTENER]: this.errorPolicy.onListenerError,
      [ERROR_TYPE.EMIT]: this.errorPolicy.onEmitError,
      [ERROR_TYPE.MIDDLEWARE]: this.errorPolicy.onMiddlewareError,
    };

    const policy = policy_map[type];

    if (!policy) {
      throw new Error(`Invalid error type: ${type}`);
    }

    const strategy = this.getErrorHandlingStrategy(policy);

    return strategy(error, event, type);
  }

  /**
   * Adds a middleware function to the event processing pipeline
   * @param middleware - The middleware function to add
   * @returns A function to remove the middleware
   */
  use(middleware: Middleware<T>): () => void {
    this.middlewares.add(middleware);

    return () => {
      this.middlewares.delete(middleware);
    };
  }

  /**
   * Emits an event with the specified name and data
   * @template K - The event name type
   * @param eventName - The name of the event to emit
   * @param data - The data to emit with the event
   */
  emit<K extends keyof T>(eventName: K, data: T[K]): void {
    try {
      const composed = Array.from(this.middlewares).reduceRight(
        (next, middleware) => {
          try {
            return middleware(next);
          } catch (error) {
            const handled = this.handleError(
              error as Error,
              { name: eventName, data },
              ERROR_TYPE.MIDDLEWARE
            );

            if (!handled) {
              throw error;
            }

            return next;
          }
        },
        (event: Event<T, keyof T>) => {
          // Broadcast to listeners after middleware processing
          for (const listener of this.listeners.get(eventName) || []) {
            try {
              listener(event.data);
            } catch (error) {
              this.handleError(
                error as Error,
                { name: event.name, data: event.data },
                ERROR_TYPE.LISTENER
              );
            }
          }
        }
      );

      composed({ name: eventName, data });
    } catch (error) {
      this.handleError(
        error as Error,
        { name: eventName, data },
        ERROR_TYPE.EMIT
      );
    }
  }

  /**
   * Subscribes to an event
   * @template K - The event name type
   * @param eventName - The name of the event to subscribe to
   * @param listener - The listener function to call when the event is emitted
   * @returns A function to unsubscribe the listener
   */
  on<K extends keyof T>(
    eventName: K,
    listener: EventListener<T, K>
  ): Unsubscribe {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const listeners = this.listeners.get(eventName);

    if (listeners && listeners.size >= this.maxListeners) {
      console.warn(
        `EventFlow warning: Event "${String(
          eventName
        )}" has exceeded maximum listener count (${this.maxListeners})`
      );
    }

    listeners?.add(listener as unknown as EventListener<T, keyof T>);

    return () => this.off(eventName, listener);
  }

  /**
   * Subscribes to an event for a single emission
   * @template K - The event name type
   * @param eventName - The name of the event to subscribe to
   * @param listener - The listener function to call when the event is emitted
   * @returns A function to unsubscribe the listener
   */
  once<K extends keyof T>(
    eventName: K,
    listener: EventListener<T, K>
  ): Unsubscribe {
    const wrappedListener: EventListener<T, K> = (data) => {
      listener(data);
      this.off(eventName, wrappedListener);
    };

    return this.on(eventName, wrappedListener);
  }

  /**
   * Unsubscribes a listener from an event
   * @template K - The event name type
   * @param eventName - The name of the event to unsubscribe from
   * @param listener - The listener function to remove
   */
  off<K extends keyof T>(eventName: K, listener: EventListener<T, K>): void {
    const listeners = this.listeners.get(eventName);

    if (listeners) {
      listeners.delete(listener as unknown as EventListener<T, keyof T>);

      if (listeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * Removes all event listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}
