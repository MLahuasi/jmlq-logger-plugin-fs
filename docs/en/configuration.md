# Configuration — @jmlq/logger-plugin-fs ⚙️

## 🎯 Objective

Document how to configure `@jmlq/logger-plugin-fs` in a real host and how to integrate it into the `@jmlq/logger` bootstrap.

## Create datasource with `createFsDatasource`

Minimal configuration:

```ts
import { createFsDatasource } from "@jmlq/logger-plugin-fs";

const fsDatasource = createFsDatasource({
  basePath: "./logs",
});
```

## Real datasource configuration

Full example using a typical host bootstrap:

```ts
const fsDatasource = createFsDatasource({
  basePath: envs.logger.LOGGER_FS_PATH,
  fileNamePattern: "app-{yyyy}{MM}{dd}.log",
  rotation: { by: "day" },
  mkdir: true,
  onRotate: (oldPath, newPath) => {
    console.log(
      `   [Rotate] Rotation completed: ${oldPath.absolutePath} → ${newPath.absolutePath}`,
    );
  },
  onError: (err) => {
    console.error("   [Error Handler]", err.message);
  },
});
```

## Available options

### `basePath`

Base directory where the plugin creates or reads log files.

```ts
basePath: "./logs";
```

### `mkdir`

If enabled, the plugin can create the base directory if it does not exist.

```ts
mkdir: true;
```

### `fileNamePattern`

File name pattern. If not provided, the factory uses this default value:

```ts
"app-{yyyy}{MM}{dd}.log";
```

Valid examples:

```ts
fileNamePattern: "app-{yyyy}{MM}{dd}.log";
fileNamePattern: "auth-{yyyy}-{MM}-{dd}.log";
fileNamePattern: "application.log";
```

### `rotation`

The configuration maps to `IFileSystemRotationConfig`.

Examples:

```ts
rotation: { by: "day" }
rotation: { by: "none" }
rotation: { by: "size", maxSizeMB: 50, maxFiles: 10 }
```

### `onRotate`

Useful hook for operational observability.

```ts
onRotate: (oldPath, newPath) => {
  console.log(`${oldPath.absolutePath} -> ${newPath.absolutePath}`);
};
```

### `onError`

Centralized hook to handle datasource errors.

```ts
onError: (err) => {
  console.error(err.message);
};
```

## Recommended adapter in infrastructure

Practical example:

```ts
import {
  createFsDatasource,
  type IFilesystemDatasourceOptions,
} from "@jmlq/logger-plugin-fs";
import type { ILogDatasource } from "@jmlq/logger";

export class FsAdapter {
  private constructor(private readonly ds: ILogDatasource) {}

  static create(opts: IFilesystemDatasourceOptions): FsAdapter | undefined {
    try {
      const ds = createFsDatasource(opts);
      console.log("[logger] Connected to FS for logs");
      return new FsAdapter(ds);
    } catch (e: any) {
      console.warn("[logger] FS disabled:", e?.message ?? e);
    }
  }

  get datasource(): ILogDatasource {
    return this.ds;
  }
}
```

## Host environment variables

The plugin does not include a `.env` reader.
In the host, values can be resolved like this:

```ts
process.env.LOGGER_FS_PATH;
process.env.LOG_LEVEL;
process.env.LOGGER_PII_ENABLED;
process.env.LOGGER_PII_INCLUDE_DEFAULTS;
```

## ✅ Checklist

- [ ] Define `LOGGER_FS_PATH` or an equivalent path in the host
- [ ] Create the datasource with `createFsDatasource`
- [ ] Choose `fileNamePattern`
- [ ] Choose rotation policy
- [ ] Integrate the datasource into the `@jmlq/logger` bootstrap

---

## ⬅️ Previous

- [`architecture`](./architecture.md)

## ➡️ Next

- [Express Integration](./integration-express.md)
- [Troubleshooting](./troubleshooting.md)
