import type { Event, EventMap, Middleware } from "../types";

export const createLoggerMiddleware = <T extends EventMap>(
  options: {
    console?: boolean;
    customLogger?: (event: Event<T, keyof T>) => void;
  } = {}
): Middleware<T> => {
  return (next) => (event) => {
    if (options.console) {
      console.group(
        `EventFlow event: ${String(
          event.name
        )} at ${new Date().toLocaleString()}`
      );
      console.log("Payload:", event.data);
      console.groupEnd();
    }

    options.customLogger?.(event);

    return next(event);
  };
};
