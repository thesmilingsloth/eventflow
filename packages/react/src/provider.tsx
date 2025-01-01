import React, { createContext, useContext } from "react";
import type { EventEmitter, EventMap } from "@thesmilingsloth/eventflow-core";

/**
 * React Context for the EventBroker instance
 * @internal
 */
const EventBrokerContext = createContext<{
  broker: EventEmitter<EventMap>;
} | null>(null);

/**
 * Props for the EventBrokerProvider component
 * @template T - Event map type
 */
export interface EventBrokerProviderProps<T extends EventMap>
  extends React.PropsWithChildren {
  /** The EventBroker instance to provide to the React tree */
  broker: EventEmitter<T>;
}

/**
 * Provider component that makes an EventBroker instance available to the React component tree
 *
 * @template T - Event map type
 * @param props - Component props including the broker instance and children
 * @returns React component that provides the EventBroker context
 *
 * @example
 * ```tsx
 * const broker = createEventBroker<MyEvents>();
 *
 * function App() {
 *   return (
 *     <EventBrokerProvider broker={broker}>
 *       <MyComponents />
 *     </EventBrokerProvider>
 *   );
 * }
 * ```
 */
export function EventBrokerProvider<T extends EventMap>({
  broker,
  children,
}: EventBrokerProviderProps<T>) {
  return (
    <EventBrokerContext.Provider
      value={{ broker: broker as unknown as EventEmitter<EventMap> }}
    >
      {children}
    </EventBrokerContext.Provider>
  );
}

/**
 * Hook to access the EventBroker instance from the React context
 *
 * @template T - Event map type
 * @returns The EventBroker instance
 * @throws Error if used outside of EventBrokerProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const broker = useEventBroker<MyEvents>();
 *
 *   useEffect(() => {
 *     const unsubscribe = broker.on('user:login', (data) => {
 *       console.log('User logged in:', data.userId);
 *     });
 *
 *     return () => unsubscribe();
 *   }, [broker]);
 *
 *   return <div>My Component</div>;
 * }
 * ```
 */
export function useEventBroker<T extends EventMap>(): EventEmitter<T> {
  const context = useContext(EventBrokerContext);

  if (!context) {
    throw new Error("useEventBroker must be used within EventBrokerProvider");
  }

  return context.broker as unknown as EventEmitter<T>;
}
