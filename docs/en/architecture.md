# @jmlq/logger-plugin-fs — Architecture 🏛️

## 🎯 Objective

Explain how `@jmlq/logger-plugin-fs` builds a filesystem datasource compatible with `@jmlq/logger` and how its internal responsibilities are distributed.

## ⭐ Importance

The plugin architecture allows:

- isolating rotation and naming logic,
- decoupling the logger core from concrete Node.js APIs,
- maintaining testability through ports,
- using the plugin as a replaceable datasource.

## 🧱 Main components (what the package exposes)

### Public API

The real entry point is:

```ts
createFsDatasource(options: IFilesystemDatasourceOptions): ILogDatasource
```

### Public configuration

```ts
export interface IFilesystemDatasourceOptions {
  basePath: string;
  mkdir?: boolean;
  fileNamePattern?: string;
  rotation?: IFileSystemRotationConfig;
  onRotate?: (oldPath: FilePath, newPath: FilePath) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}
```

### Important Value Objects

- `FileNamePattern`
- `FileRotationPolicy`

### Main use cases

- `EnsureDirectoryUseCase`
- `AppendLogUseCase`
- `RotateIfNeededUseCase`
- `PersistLogUseCase`
- `FindLogsUseCase`

### Main adapters

- `SystemClockAdapter`
- `SystemFilePathAdapter`
- `FileSystemProviderAdapter`
- `LogStreamWriterAdapter`
- `FileRotatorAdapter`
- `FileSystemLogFileEnumeratorAdapter`
- `FileSystemLogFileLineReaderAdapter`
- `FsDatasourceAdapter`

## 🔁 Flows (diagrams)

### Write flow (save)

```mermaid
flowchart LR
  A["@jmlq/logger"] --> B["FsDatasourceAdapter.save"]
  B --> C["PersistLogUseCase"]
  C --> D["EnsureDirectoryUseCase"]
  C --> E["RotateIfNeededUseCase"]
  C --> F["AppendLogUseCase"]
  E --> G["FileRotatorAdapter"]
  F --> H["LogStreamWriterAdapter"]
```

### Read flow (find)

```mermaid
flowchart LR
  Logger["@jmlq/logger find"] --> Adapter["FsDatasourceAdapter.find"]
  Adapter --> UC["FindLogsUseCase"]
  UC --> Enum["FileSystemLogFileEnumeratorAdapter"]
  UC --> Reader["FileSystemLogFileLineReaderAdapter"]
  UC --> Filter["Filtering and pagination"]
```

## 🧩 Clean Architecture (real mapping)

```mermaid
flowchart TB
  subgraph Domain
    D1[FileNamePattern]
    D2[FileRotationPolicy]
    D3[Ports]
  end

  subgraph Application
    A1[createFsDatasource]
    A2[PersistLogUseCase]
    A3[RotateIfNeededUseCase]
    A4[AppendLogUseCase]
    A5[EnsureDirectoryUseCase]
    A6[FindLogsUseCase]
  end

  subgraph Infrastructure
    I1[SystemClockAdapter]
    I2[SystemFilePathAdapter]
    I3[FileSystemProviderAdapter]
    I4[LogStreamWriterAdapter]
    I5[FileRotatorAdapter]
    I6[FsDatasourceAdapter]
    I7[File Enumerator / Line Reader]
  end

  A1 --> D1
  A1 --> D2
  A1 --> I1
  A1 --> I2
  A1 --> I3
  A1 --> I4
  A1 --> I5
  A1 --> A2
  A1 --> A3
  A1 --> A4
  A1 --> A5
  A1 --> A6
  A6 --> I7
  I6 --> A2
  I6 --> A6
```

## Real factory implementation

Functional summary based on the actual implementation:

```ts
const fileNamePattern = new FileNamePattern(
  options.fileNamePattern || "app-{yyyy}{MM}{dd}.log",
);

const rotationPolicy = new FileRotationPolicy(
  options.rotation?.by || "day",
  options.rotation?.maxSizeMB,
  options.rotation?.maxFiles,
);

const clock = new SystemClockAdapter();
const filePath = new SystemFilePathAdapter();
const fsProvider = new FileSystemProviderAdapter();
const writer = new LogStreamWriterAdapter();

const fileRotator = new FileRotatorAdapter(
  fsProvider,
  filePath,
  fileNamePattern,
  options.basePath,
);

const ensureDirectoryUseCase = new EnsureDirectoryUseCase(
  fsProvider,
  options.basePath,
  options.mkdir,
);

const appendLogUseCase = new AppendLogUseCase(writer);

const rotateIfNeededUseCase = new RotateIfNeededUseCase(
  fileRotator,
  writer,
  options.onRotate,
);

const persistLogUseCase = new PersistLogUseCase(
  clock,
  fileRotator,
  writer,
  rotationPolicy,
  rotateIfNeededUseCase,
  appendLogUseCase,
  ensureDirectoryUseCase,
  options.onError,
);

return new FsDatasourceAdapter(persistLogUseCase, writer, findLogsUseCase);
```

## ✅ Checklist

- [ ] Define `basePath`
- [ ] Choose `fileNamePattern`
- [ ] Choose rotation policy (`day`, `size`, `none`)
- [ ] Decide if the plugin should create directories (`mkdir`)
- [ ] Implement `onRotate` and `onError` hooks if needed
- [ ] Integrate the datasource into the logger bootstrap

---

## ⬅️ Previous

- [`home`](../../README.md)

## ➡️ Next

- [Configuration](./configuration.md)
- [Express Integration](./integration-express.md)
- [Troubleshooting](./troubleshooting.md)
