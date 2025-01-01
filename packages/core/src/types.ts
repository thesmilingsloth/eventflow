/** Default maximum number of listeners allowed per event */
export const DEFAULT_MAX_LISTENERS = 10;

/** Error handling policies for the event broker */
export const POLICY = {
  /** Continue execution after error */
  CONTINUE: "continue",
  /** Stop execution on error */
  STOP: "stop",
} as const;

/** Default error handling configuration */
export const DEFAULT_ERROR_POLICY = {
  onListenerError: POLICY.CONTINUE,
  onEmitError: POLICY.CONTINUE,
  onMiddlewareError: POLICY.CONTINUE,
} as const satisfies ErrorPolicy<EventMap>;

/** Types of errors that can occur in the event system */
export const ERROR_TYPE = {
  /** Error in event listener */
  LISTENER: "listener",
  /** Error during event emission */
  EMIT: "emit",
  /** Error in middleware */
  MIDDLEWARE: "middleware",
} as const;

/** Error handling policy type */
export type Policy = (typeof POLICY)[keyof typeof POLICY];

/** Error type identifier */
export type ErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];

/** Valid event name type */
export type EventName = string;

/**
 * Base event map interface. All custom event maps should extend this.
 * @example
 * ```typescript
 * interface MyEvents extends EventMap {
 *   'user:login': { userId: string };
 *   'notification:show': { message: string; type: 'success' | 'error' };
 * }
 * ```
 */
export interface EventMap {
  [key: EventName]: unknown;
  [key: number]: never;
  [key: symbol]: never;
}

/**
 * Event listener function type
 * @template T - Event map type
 * @template K - Event name type (keyof T)
 */
export type EventListener<T, K extends keyof T = keyof T> = (
  data: T[K]
) => void;

/**
 * Event object type representing an event with its name and data
 * @template T - Event map type
 * @template K - Event name type (keyof T)
 */
export type Event<T extends EventMap, K extends keyof T> = {
  name: K;
  data: T[K];
};

/**
 * Next function type for middleware chain
 * @template T - Event map type
 * @template K - Event name type (keyof T)
 */
export type Next<T extends EventMap, K extends keyof T = keyof T> = (
  event: Event<T, K>
) => void;

/**
 * Middleware function type
 * @template T - Event map type
 */
export type Middleware<T extends EventMap> = (
  next: Next<T, keyof T>
) => Next<T, keyof T>;

/**
 * Error handler function type
 * @template T - Event map type
 */
export type ErrorHandler<T extends EventMap = EventMap> = (
  error: Error,
  event: { name: keyof T; data: T[keyof T] }
) => void;

/**
 * Error policy configuration
 * @template T - Event map type
 */
export type ErrorPolicy<T extends EventMap = EventMap> = {
  /** Policy or handler for listener errors */
  onListenerError?: Policy | ErrorHandler<T>;
  /** Policy or handler for emit errors */
  onEmitError?: Policy | ErrorHandler<T>;
  /** Policy or handler for middleware errors */
  onMiddlewareError?: Policy | ErrorHandler<T>;
};

/**
 * Event broker configuration options
 * @template T - Event map type
 */
export interface EventBrokerOptions<T extends EventMap = EventMap> {
  /** Enable console logging middleware */
  logger?: boolean;
  /** Maximum number of listeners per event */
  maxListeners?: number;
  /** Error handling configuration */
  errorPolicy?: ErrorPolicy<T>;
  /** Array of middleware functions */
  middlewares?: Middleware<T>[];
  /** Global error handler */
  errorHandler?: ErrorHandler<T>;
}

/** Unsubscribe function type returned by event subscriptions */
export type Unsubscribe = () => void;

/**
 * Core event emitter interface
 * @template T - Event map type
 */
export interface EventEmitter<T extends EventMap> {
  /**
   * Emit an event with data
   * @template K - Event name type (keyof T)
   * @param eventName - Name of the event to emit
   * @param data - Event data
   */
  emit<K extends keyof T>(eventName: K, data: T[K]): void;

  /**
   * Subscribe to an event
   * @template K - Event name type (keyof T)
   * @param eventName - Name of the event to subscribe to
   * @param listener - Event listener function
   * @returns Unsubscribe function
   */
  on<K extends keyof T>(
    eventName: K,
    listener: EventListener<T, K>
  ): Unsubscribe;

  /**
   * Subscribe to an event once
   * @template K - Event name type (keyof T)
   * @param eventName - Name of the event to subscribe to
   * @param listener - Event listener function
   * @returns Unsubscribe function
   */
  once<K extends keyof T>(
    eventName: K,
    listener: EventListener<T, K>
  ): Unsubscribe;

  /**
   * Unsubscribe from an event
   * @template K - Event name type (keyof T)
   * @param eventName - Name of the event to unsubscribe from
   * @param listener - Event listener function to remove
   */
  off<K extends keyof T>(eventName: K, listener: EventListener<T, K>): void;

  /** Remove all event subscriptions */
  clear(): void;

  /**
   * Add middleware to the event broker
   * @param middleware - Middleware function
   * @returns Function to remove the middleware
   */
  use(middleware: Middleware<T>): () => void;
}
