# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Genkit Configuration (`ai/genkit.ts`)

This project uses Genkit for its Generative AI capabilities. The configuration in `ai/genkit.ts` is designed to be both developer-friendly and production-ready by automatically adapting to the environment.

### How It Works

The configuration checks the `NODE_ENV` environment variable to determine whether to run in development or production mode.

| Environment | Tracing & Metrics | Log Level |
|-------------|-------------------|-----------|
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
  logLevel: isDev ? 'debug' : 'info',
  enableTracingAndMetrics: isDev,
});
```

### Production Environment (`NODE_ENV=production`)

When deployed to Firebase Hosting (or any production environment), the configuration is optimized for performance and stability:

-   **Tracing & Metrics:** Disabled (`enableTracingAndMetrics: false`). This prevents unnecessary OpenTelemetry peer dependencies from being required in the build, which keeps the deployment lean and avoids build failures on Firebase.
-   **Logging:** The log level is set to `info`. This captures key events and errors without flooding production logs with verbose debug information.

### Development Environment (`NODE_ENV=development`)

When running locally with `npm run dev`, the configuration provides enhanced diagnostics:

-   **Tracing & Metrics:** Enabled (`enableTracingAndMetrics: true`). This allows for detailed inspection of Genkit flows and AI calls during development.
-   **Logging:** The log level is set to `debug`. This provides verbose output to the console, making it easier to trace execution and troubleshoot issues.

### Troubleshooting

-   **"Module not found: Can't resolve '@opentelemetry/...'":** This error occurs if you enable tracing in a production-like environment without installing the optional peer dependencies. The current setup avoids this by disabling tracing in production. If you need tracing in production, you must explicitly install the missing `@opentelemetry` packages listed in the build error.
-   **"Why don't I see `debug` logs in production?":** This is by design. The logger's level is set to `info` in production to reduce noise. Only `info`, `warn`, and `error` level logs will appear. To see more verbose logs, you would need to change the log level in `ai/genkit.ts` for the production environment, which is not recommended.
