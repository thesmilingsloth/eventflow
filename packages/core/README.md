# @thesmilingsloth/eventflow-core

[![npm version](https://img.shields.io/npm/v/@thesmilingsloth/eventflow-core.svg?style=flat)](https://www.npmjs.com/package/@thesmilingsloth/eventflow-core)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@thesmilingsloth/eventflow-core)](https://bundlephobia.com/package/@thesmilingsloth/eventflow-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A type-safe event broker for frontend applications with first-class TypeScript support.

## Features

- 🎯 **Type-safe**: Full TypeScript support with type inference
- ⚡ **Lightweight**: Zero dependencies for core functionality
- 🔌 **Middleware Support**: Extensible through middleware system
- 🛡️ **Error Handling**: Configurable error policies
- 📦 **Tree-shakeable**: Only bundle what you use
- 🔍 **DevTools**: Built-in logger middleware for debugging

## Installation

```bash
# Using npm
npm install @thesmilingsloth/eventflow-core

# Using yarn
yarn add @thesmilingsloth/eventflow-core

# Using pnpm
pnpm add @thesmilingsloth/eventflow-core
```

## Quick Start

```typescript
import { createEventBroker } from "@thesmilingsloth/eventflow-core";

// Define your events
interface UserEvents {
  "user:login": {
    userId: string;
    timestamp: number;
  };
}

interface AppEvents {
  "app:notification": {
    message: string;
    type: "success" | "error";
  };
  "app:themeChange": "light" | "dark";
}

// Compose event types
type MyEvents = UserEvents & AppEvents;

// Create broker
const broker = createEventBroker<MyEvents>();

// Subscribe to events
const unsubscribe = broker.on("user:login", (data) => {
  console.log(`User ${data.userId} logged in at ${new Date(data.timestamp)}`);
});

// Emit events
broker.emit("user:login", {
  userId: "123",
  timestamp: Date.now(),
});

// Cleanup
unsubscribe();
```

## Advanced Usage

### Custom Middleware

```typescript
const analyticsMiddleware: Middleware<MyEvents> = (next) => (event) => {
  // Before event
  trackEvent(event.name, event.data);

  // Process event
  next(event);

  // After event
  console.log("Event processed:", event.name);
};

broker.use(analyticsMiddleware);
```

### Error Handling

```typescript
const broker = createEventBroker<MyEvents>({
  errorPolicy: {
    onListenerError: "continue", // Continue on listener errors
    onEmitError: "stop", // Stop on emit errors
    onMiddlewareError: (error, event) => {
      // Custom middleware error handling
      reportError(error);
      console.error(`Error in middleware for ${event.name}:`, error);
    },
  },
});
```

### Type-Safe Events

```typescript
interface MyEvents {
  // Simple events
  "user:logout": void;

  // Events with data
  "user:login": {
    username: string;
    timestamp: number;
  };

  // Union types
  "app:notification": {
    type: "success" | "error" | "info";
    message: string;
  };
}
```

## API Reference

### createEventBroker

Creates a new event broker instance with optional configuration.

```typescript
const broker = createEventBroker<MyEvents>({
  logger?: boolean;
  maxListeners?: number;
  errorPolicy?: ErrorPolicy<T>;
  middlewares?: Middleware<T>[];
});
```

### EventEmitter Methods

- `emit<K extends keyof T>(eventName: K, data: T[K]): void`
- `on<K extends keyof T>(eventName: K, listener: EventListener<T, K>): Unsubscribe`
- `once<K extends keyof T>(eventName: K, listener: EventListener<T, K>): Unsubscribe`
- `off<K extends keyof T>(eventName: K, listener: EventListener<T, K>): void`
- `clear(): void`
- `use(middleware: Middleware<T>): () => void`

## Related Packages

- [@thesmilingsloth/eventflow-react](https://www.npmjs.com/package/@thesmilingsloth/eventflow-react) - React integration

## Contributing

Contributions are welcome!

## License

MIT © [Smiling Sloth](https://github.com/thesmilingsloth)
