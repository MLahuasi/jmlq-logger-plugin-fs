# Express Integration — @jmlq/logger-plugin-fs 🚏

## 🎯 Objective

Show how to integrate `@jmlq/logger-plugin-fs` into an Express host using `@jmlq/logger` as the main facade.

## Logger bootstrap in the host

Functional example of a bootstrap using the FS adapter:

```ts
import { type ILogDatasource, createLogger } from "@jmlq/logger";
import { FsAdapter } from "../fs/fs.adapter";

export class LoggerBootstrap {
  private constructor(
    private readonly _logger: ReturnType<typeof createLogger>,
  ) {}

  static async create(opts: LoggerBootstrapOptions): Promise<LoggerBootstrap> {
    const dsList: ILogDatasource[] = [];

    if (opts.adapters?.fs) {
      const fs = FsAdapter.create(opts.adapters.fs);
      if (fs) dsList.push(fs.datasource);
    }

    if (dsList.length === 0) throw new Error("[logger] No valid datasources.");

    const logger = createLogger({
      datasources: dsList,
      minLevel: opts.minLevel,
      redactorOptions: {
        enabled: opts.pii?.enabled ?? false,
        deep: opts.pii?.deep ?? true,
        patterns: opts.pii?.patterns ?? [],
      },
    });

    return new LoggerBootstrap(logger);
  }

  get logger() {
    return this._logger;
  }

  async flush() {
    const logs = this._logger as any;
    if (typeof logs.flush === "function") await logs.flush();
  }
}
```

## Logger singleton initialization

```ts
async function init() {
  return LoggerBootstrap.create({
    minLevel: parseLogLevel(envs.logger.LOGGER_LEVEL),
    pii: {
      enabled: envs.logger.LOGGER_PII_ENABLED,
      includeDefaults: envs.logger.LOGGER_PII_INCLUDE_DEFAULTS,
      deep: true,
      patterns: [
        {
          pattern: "\\b\\d{4}-\\d{4}-\\d{4}-\\d{4}\\b",
          replaceWith: "****-****-****-****",
        },
        {
          pattern: "[\\w.-]+@[\\w.-]+",
          replaceWith: "***@***",
        },
      ],
    },
    adapters: {
      fs: envs.logger.LOGGER_FS_PATH
        ? {
            basePath: envs.logger.LOGGER_FS_PATH,
            fileNamePattern: "app-{yyyy}{MM}{dd}.log",
            rotation: { by: "day" },
            mkdir: true,
          }
        : undefined,
    },
  });
}

export const bootReady =
  globalThis.__LOGGER_BOOT__ ?? (globalThis.__LOGGER_BOOT__ = init());

export const loggerReady = bootReady.then((b) => b.logger);
```

## Attach logger to request

Typical middleware:

```ts
import { randomUUID } from "crypto";
import type { ILogger } from "@jmlq/logger";
import type { Request, Response, NextFunction } from "express";

export function attachLogger(base: ILogger) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    req.logger = base;
    req.requestId = (req.headers["x-request-id"] as string) ?? randomUUID();
    next();
  };
}
```

## Usage in controllers

In the `ml-dev-rest-api` host, there is already real usage of `req.logger` inside controllers and auth flows.
The integration with the FS plugin is transparent: the controller writes to the logger, and the logger persists using the configured FS datasource.

## Flush and graceful shutdown

Before shutting down the process:

```ts
export async function flushLogs() {
  const boot = await bootReady;
  await boot.flush();
}
```

## ✅ Checklist

- [ ] Create `FsAdapter` in infrastructure
- [ ] Integrate `fs.datasource` into `createLogger(...)`
- [ ] Initialize the logger only once
- [ ] Attach `req.logger` using middleware
- [ ] Execute `flush()` on graceful shutdown

---

## ⬅️ Previous

- [`architecture`](./architecture.md)

## ➡️ Next

- [Configuration](./configuration.md)
- [Troubleshooting](./troubleshooting.md)
