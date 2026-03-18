# Troubleshooting — @jmlq/logger-plugin-fs 🩺

## 🎯 Objective

Resolve common issues when integrating `@jmlq/logger-plugin-fs` in an Express host or any Node.js host.

## 1) Log directory is not created

Check:

- `basePath` points to a valid path.
- `mkdir` is enabled if you expect automatic creation.
- the process has write permissions.

Expected example:

```ts
createFsDatasource({
  basePath: "./logs",
  mkdir: true,
});
```

## 2) The plugin does not rotate files

Check the configured policy:

```ts
rotation: { by: "day" }
rotation: { by: "size", maxSizeMB: 50, maxFiles: 10 }
rotation: { by: "none" }
```

Common causes:

- `by: "none"` disables rotation.
- in `size`, `maxSizeMB` is missing.
- the file pattern does not change when expecting daily rotation.

## 3) `FsAdapter.create(...)` returns `undefined`

In the documented adapter pattern, this happens when `createFsDatasource(...)` throws an error and the adapter catches it.

Check:

- `basePath`
- process permissions
- `rotation` configuration
- errors printed by `console.warn("[logger] FS disabled:", ...)`

## 4) Cannot find logs with `find(...)`

Check:

- `.log` files actually exist in `basePath`,
- each line is valid JSON,
- filters (date, level, query) are not too restrictive.

## 5) Process ends and recent logs are lost

Execute `flush()` before graceful shutdown.

Example:

```ts
await flushLogs();
```

## ✅ Checklist

- [ ] Verify `basePath`
- [ ] Verify `mkdir`
- [ ] Verify `rotation` policy
- [ ] Check write permissions
- [ ] Execute `flush()` on shutdown

---

## ⬅️ Previous

- [`architecture`](./architecture.md)

## ➡️ Next

- [Configuration](./configuration.md)
- [Express Integration](./integration-express.md)
