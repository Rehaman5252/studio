
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Genkit Configuration (`ai/genkit.ts`)

This project uses Genkit for its Generative AI capabilities. The configuration in `ai/genkit.ts` automatically adapts to the environment for both optimal development diagnostics and production performance.

### How It Works

The configuration checks the `NODE_ENV` environment variable to determine the build mode.

| Environment   | Tracing & Metrics | Log Level |
| :------------ | :---------------- | :-------- |
| `development` | **Enabled**       | `debug`   |
| `production`  | **Disabled**      | `info`    |

This is achieved with a simple environment check:

```ts
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  logger.setLevel('debug');
} else {
  logger.setLevel('info');
}

export const ai = configureGenkit({
  plugins: [
    // ...
  ],
  // Tracing and metrics are disabled in production to prevent build failures
  // due to missing optional @opentelemetry packages on Firebase.
  enableTracingAndMetrics: isDev,
});
```

### Production Environment (`NODE_ENV=production`)

When deployed to Firebase Hosting, the configuration is optimized for performance:

-   **Tracing & Metrics:** Disabled (`enableTracingAndMetrics: false`). This keeps the deployment lean by preventing optional `@opentelemetry` peer dependencies from being required in the build, which could otherwise cause build failures on Firebase.
-   **Logging:** Set to `info` to capture key events and errors without flooding production logs.

### Development Environment (`NODE_ENV=development`)

When running locally with `npm run dev`, the configuration provides enhanced diagnostics:

-   **Tracing & Metrics:** Enabled (`enableTracingAndMetrics: true`) for detailed inspection of Genkit flows.
-   **Logging:** Set to `debug` to provide verbose console output for easier troubleshooting.

### Troubleshooting

-   **"Module not found: Can't resolve '@opentelemetry/...'":** This error occurs if tracing is enabled in a production-like environment without installing the optional peer dependencies. The current setup avoids this by disabling tracing in production. If you need tracing in production, you must explicitly install the missing `@opentelemetry` packages listed in the build error.
-   **"Why don't I see `debug` logs in production?":** This is by design. The logger is set to `info` in production to reduce noise. Only `info`, `warn`, and `error` level logs will appear. To enable debug logs in production, you would need to change the log level in `ai/genkit.ts`, which is not recommended.
