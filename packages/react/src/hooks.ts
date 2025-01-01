import { useCallback, useEffect, useState } from "react";
import type { EventListener, EventMap } from "@thesmilingsloth/eventflow-core";
import { useEventBroker } from "./provider";

/**
 * Hook to subscribe to events in the EventBroker, and automatically unsubscribes when the component unmounts
 *
 * @template T - Event map type
 * @template K - Event name type (keyof T)
 * @param eventName - The name of the event to subscribe to
 * @param listener - The callback function to execute when the event is emitted
 *
 * @example
 * ```tsx
 * useEventListener('user:login', (data) => {
 *   console.log('User logged in:', data.userId);
 * });
 * ```
 */
export function useEventListener<
  T extends EventMap,
  K extends keyof T = keyof T
>(eventName: K, listener: (data: T[K]) => void): void {
  const broker = useEventBroker<T>();

  useEffect(() => {
    const unsubscribe = broker.on(eventName, listener);

    return () => unsubscribe();
  }, [broker, eventName, listener]);
}

/**
 * Hook to get a typed event emitter function
 *
 * @template T - Event map type
 * @template K - Event name type (keyof T)
 * @param eventName - The name of the event to emit
 * @returns A function that emits the event with type-safe data
 *
 * @example
 * ```tsx
 * const emitLogin = useEventEmitter('user:login');
 *
 * return (
 *   <button onClick={() => emitLogin({ userId: '123' })}>
 *     Login
 *   </button>
 * );
 * ```
 */
export function useEventEmitter<
  T extends EventMap,
  K extends keyof T = keyof T
>(eventName: K): EventListener<T, K> {
  const broker = useEventBroker<T>();

  return useCallback(
    (data: T[K]) => {
      broker.emit(eventName, data);
    },
    [broker, eventName]
  );
}

/**
 * Hook to manage state through events, and automatically unsubscribes when the component unmounts
 *
 * @template T - Event map type
 * @template K - Event name type (keyof T)
 * @param eventName - The name of the event to sync state with
 * @param initialState - The initial state value
 * @returns A tuple containing the current state and a function to update it
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useEventState('app:theme', 'light');
 *
 * return (
 *   <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *     Toggle Theme
 *   </button>
 * );
 * ```
 */
export function useEventState<T extends EventMap, K extends keyof T = keyof T>(
  eventName: K,
  initialState: T[K]
): [T[K], EventListener<T, K>] {
  const [state, setState] = useState<T[K]>(initialState);
  const broker = useEventBroker<T>();

  useEffect(() => {
    const unsubscribe = broker.on(eventName, (data) => {
      setState(data);
    });

    return () => unsubscribe();
  }, [broker, eventName]);

  const emit = useCallback(
    (data: T[K]) => {
      broker.emit(eventName, data);
    },
    [broker, eventName]
  );

  return [state, emit] as const;
}

/**
 * Hook to subscribe to an event once, and then unsubscribes automatically
 *
 * @template T - Event map type
 * @template K - Event name type (keyof T)
 * @param eventName - The name of the event to subscribe to
 * @param listener - The callback function to execute when the event is emitted
 *
 * @example
 * ```tsx
 * useEventOnce('app:init', (data) => {
 *   console.log('App initialized with config:', data);
 * });
 * ```
 */
export function useEventOnce<T extends EventMap, K extends keyof T = keyof T>(
  eventName: K,
  listener: (data: T[K]) => void
): void {
  const broker = useEventBroker<T>();

  useEffect(() => {
    const unsubscribe = broker.once(eventName, listener);

    return () => unsubscribe();
  }, [broker, eventName, listener]);
}
