# Integración con Express — @jmlq/logger-plugin-fs 🚏

## 🎯 Objetivo

Mostrar cómo integrar `@jmlq/logger-plugin-fs` dentro de un host Express usando `@jmlq/logger` como fachada principal.

## Bootstrap del logger en el host

Ejemplo funcional de bootstrap con adapter FS:

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

    if (dsList.length === 0)
      throw new Error("[logger] No hay datasources válidos.");

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

## Inicialización singleton del logger

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

## Adjuntar logger al request

Middleware típico:

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

## Uso desde controllers

En el host `ml-dev-rest-api` ya existe uso real de `req.logger` dentro de controllers y flujos de auth.  
La integración con el plugin FS es transparente: el controller escribe al logger y el logger persiste usando el datasource FS configurado.

## Flush y cierre ordenado

Antes de apagar el proceso:

```ts
export async function flushLogs() {
  const boot = await bootReady;
  await boot.flush();
}
```

## ✅ Checklist

- [ ] Crear `FsAdapter` en infrastructure
- [ ] Integrar `fs.datasource` en `createLogger(...)`
- [ ] Inicializar el logger una sola vez
- [ ] Adjuntar `req.logger` con middleware
- [ ] Ejecutar `flush()` en apagado ordenado

---

## ⬅️ Anterior

- [`arquitectura`](./architecture.md)

## ➡️ Siguiente

- [Configuración](./configuration.md)
- [Troubleshooting](./troubleshooting.md)
