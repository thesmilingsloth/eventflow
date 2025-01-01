# EventFlow

<!-- [![npm downloads](https://img.shields.io/npm/dm/@eventflow/core.svg?style=flat)](https://www.npmjs.com/package/@eventflow/core) -->

[![npm version](https://img.shields.io/npm/v/@thesmilingsloth/eventflow-core.svg?style=flat)](https://www.npmjs.com/package/@thesmilingsloth/eventflow-core)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@thesmilingsloth/eventflow-core)](https://bundlephobia.com/package/@thesmilingsloth/eventflow-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A type-safe event broker for frontend applications with first-class TypeScript and React support.

## Table of Contents

- [Why EventFlow?](#why-eventflow)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core API](#core-api)
- [React Integration](#react-integration)
- [Advanced Usage](#advanced-usage)
- [Error Handling](#error-handling)
- [Middleware System](#middleware-system)
- [TypeScript Usage](#typescript-usage)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Contributing](#contributing)
- [TODO](#todo)
- [License](#license)

## Why EventFlow?

Modern frontend applications often need to handle complex state management and communication between components that aren't directly connected. While solutions like Redux or global state management tools work well for application state, they can be overkill for simple event-based communication or introduce unnecessary complexity.

EventFlow solves several common challenges in frontend development:

1. **Decoupled Communication**: Enable components, modules, and services to communicate without direct dependencies or prop drilling.
2. **Type Safety**: Unlike traditional event emitters, EventFlow ensures your events and their payloads are fully typed.
3. **Cross-Cutting Concerns**: Handle application-wide concerns like logging, analytics, or error tracking through the middleware system.
4. **Framework Independence**: While providing first-class React support, the core package works with any JavaScript environment.
5. **Predictable Error Handling**: Configure how your application behaves when events fail to emit or process.

## Features

- 🎯 **Type-safe**: Full TypeScript support with type inference
- ⚡ **Lightweight**: Zero dependencies for core functionality
- 🔌 **Middleware Support**: Extensible through middleware system
- 🛡️ **Error Handling**: Configurable error policies
- ⚛️ **React Integration**: Ready-to-use React hooks and context
- 🎭 **Framework Agnostic**: Core package works anywhere
- 📦 **Tree-shakeable**: Only bundle what you use
- 🔍 **DevTools**: Built-in logger middleware for debugging

## Installation

```bash
# Using npm
npm install @thesmilingsloth/eventflow-core
npm install @thesmilingsloth/eventflow-react # Optional React integration

# Using yarn
yarn add @thesmilingsloth/eventflow-core
yarn add @thesmilingsloth/eventflow-react # Optional React integration

# Using pnpm
pnpm add @thesmilingsloth/eventflow-core
pnpm add @thesmilingsloth/eventflow-react # Optional React integration
```

## Quick Start

### Basic Usage

```typescript
import { createEventBroker } from "@thesmilingsloth/eventflow-core";

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

// Define your events
interface MyEvents extends UserEvents, AppEvents {}

// Create broker
const broker = createEventBroker<MyEvents>();

// Subscribe to events
const unsubscribe = broker.on("user:login", (data) => {
  console.log(`User ${data.userId} logged in`);
});

// Emit events
broker.emit("user:login", {
  userId: "123",
  timestamp: Date.now(),
});

// Cleanup
unsubscribe();
```

### React Integration

```tsx
import {
  EventBrokerProvider,
  useEventListener,
  useEventEmitter,
  useEventState,
} from "@thesmilingsloth/eventflow-react";
import { createEventBroker } from "@thesmilingsloth/eventflow-core";

const broker = createEventBroker<MyEvents>();

// Provider setup
function App() {
  return (
    <EventBrokerProvider broker={broker}>
      <LoginButton />
      <ThemeToggle />
      <NotificationListener />
    </EventBrokerProvider>
  );
}

// Emit events
function LoginButton() {
  const emitLogin = useEventEmitter("user:login");

  return (
    <button
      onClick={() =>
        emitLogin({
          userId: "123",
          timestamp: Date.now(),
        })
      }
    >
      Login
    </button>
  );
}

// Listen to events
function NotificationListener() {
  useEventListener("app:notification", (data) => {
    alert(data.message);
  });

  return null;
}

// Manage state with events
function ThemeToggle() {
  const [theme, setTheme] = useEventState("app:themeChange", "light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Toggle Theme
    </button>
  );
}
```

## Core API

### createEventBroker

Creates a new event broker instance with optional configuration.

```typescript
interface EventBrokerOptions<T extends EventMap> {
  logger?: boolean;
  maxListeners?: number;
  errorPolicy?: ErrorPolicy<T>;
  middlewares?: Middleware<T>[];
}

const broker = createEventBroker<MyEvents>({
  logger: true, // Enable console logging
  maxListeners: 10, // Max listeners per event
  errorPolicy: {
    onListenerError: "continue",
    onEmitError: "stop",
    onMiddlewareError: (error, event) => {
      // Custom error handling
    },
  },
});
```

### Event Broker Methods

```typescript
// Subscribe to events
const unsubscribe = broker.on("eventName", (data) => {});

// One-time subscription
broker.once("eventName", (data) => {});

// Emit events
broker.emit("eventName", eventData);

// Unsubscribe
broker.off("eventName", listener);

// Clear all subscriptions
broker.clear();

// Add middleware
const removeMiddleware = broker.use(middleware);
```

## React Integration

### Hooks

#### useEventListener

Subscribe to events in components.

```typescript
useEventListener("eventName", (data) => {
  // Handle event
});
```

#### useEventEmitter

Get a typed emit function.

```typescript
const emit = useEventEmitter("eventName");
emit(eventData); // Type-safe event emission
```

#### useEventState

Manage state through events.

```typescript
const [state, setState] = useEventState("statefulEvent", initialState);
```

#### useEventOnce

Subscribe to an event once.

```typescript
useEventOnce("eventName", (data) => {
  // Handles event once
});
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
    // Continue on listener errors
    onListenerError: "continue",

    // Stop on emit errors
    onEmitError: "stop",

    // Custom middleware error handling
    onMiddlewareError: (error, event) => {
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

  // Generic events
  "data:loaded": {
    data: T;
    source: string;
  };
}
```

### Composing Events

```typescript
// Domain-specific event interfaces
interface UserEvents {
  "user:created": { id: string; email: string };
  "user:updated": { id: string; changes: Partial<User> };
  "user:deleted": { id: string };
}

interface AuthEvents {
  "auth:login": { email: string; password: string };
  "auth:logout": void;
  "auth:sessionExpired": { reason: string };
}

interface NotificationEvents {
  "notification:show": { message: string; type: "success" | "error" | "info" };
  "notification:clear": void;
}

// Compose your application events
type AppEvents = UserEvents & AuthEvents & NotificationEvents;

const broker = createEventBroker<AppEvents>();
```

### Advanced Middleware Patterns

```typescript
// Middleware composition
const withTiming = (next: MiddlewareNext) => (event: Event) => {
  const start = performance.now();
  next(event);
  const duration = performance.now() - start;
  console.log(`Event ${event.name} took ${duration}ms`);
};

const withRetry =
  (attempts: number) => (next: MiddlewareNext) => async (event: Event) => {
    for (let i = 0; i < attempts; i++) {
      try {
        await next(event);
        return;
      } catch (error) {
        if (i === attempts - 1) throw error;
        console.warn(`Retrying event ${event.name}, attempt ${i + 1}`);
      }
    }
  };

broker.use(withTiming);
broker.use(withRetry(3));
```

### Event Groups and Namespacing

```typescript
// Create domain-specific brokers
const userBroker = broker.namespace<UserEvents>("user");
const authBroker = broker.namespace<AuthEvents>("auth");

// Type-safe event handling for specific domains
userBroker.on("created", (user) => {
  // Handle user creation
});

authBroker.on("sessionExpired", (data) => {
  // Handle session expiration
});
```

## Troubleshooting

### Common Issues

1. **Memory Leaks**

   ```
   Problem: Event listeners not being cleaned up
   Solution: Always use the unsubscribe function or useEventListener hook
   ```

2. **Type Inference Issues**

   ```
   Problem: TypeScript not inferring event types correctly
   Solution: Ensure your event map interface follows the correct structure
   ```

3. **Middleware Order**
   ```
   Problem: Middleware not executing in expected order
   Solution: Middleware executes in the order they're added. Order them from generic to specific
   ```

## Contributing

Contributions are welcome!

### Development Setup

```bash
# Clone the repo
git clone https://github.com/thesmilingsloth/eventflow.git

# Install dependencies
pnpm install

# Build packages
pnpm build
```

### Code Style

- We use Biome for formatting and linting
- Follow the existing code style
- Write meaningful commit messages
- Keep PRs focused and atomic

## Real World Examples

### Form Validation System

```typescript
interface FormEvents {
  "form:submit": { formId: string; data: Record<string, unknown> };
  "form:validate": { formId: string; field: string; value: unknown };
  "form:error": { formId: string; errors: Record<string, string[]> };
  "form:success": { formId: string; data: Record<string, unknown> };
}

// Form validation middleware
const validationMiddleware: Middleware<FormEvents> =
  (next) => async (event) => {
    if (event.name === "form:submit") {
      const errors = await validateForm(event.data);
      if (Object.keys(errors).length > 0) {
        broker.emit("form:error", { formId: event.data.formId, errors });
        return;
      }
    }
    next(event);
  };
```

### Analytics Integration

```typescript
interface AnalyticsEvents {
  "analytics:pageView": { path: string; title: string };
  "analytics:event": { category: string; action: string; label?: string };
  "analytics:timing": { category: string; variable: string; value: number };
}

// Analytics middleware
const analyticsMiddleware: Middleware<AnalyticsEvents> = (next) => (event) => {
  // Send to analytics service
  if (event.name.startsWith("analytics:")) {
    sendToAnalytics(event.name, event.data);
  }
  next(event);
};
```

## License

MIT
