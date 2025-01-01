import { EventBroker } from "./eventBroker";

import type { EventEmitter } from "./types";

import type { EventBrokerOptions, EventMap } from "./types";

export * from "./types";
export * from "./eventBroker";

export const createEventBroker = <T extends EventMap>(
  options?: EventBrokerOptions<T>
): EventEmitter<T> => {
  return new EventBroker<T>(options);
};

export { createLoggerMiddleware as createDevToolsMiddleware } from "./middlewares/logger";
