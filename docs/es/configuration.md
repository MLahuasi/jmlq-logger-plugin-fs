# Configuración — @jmlq/logger-plugin-fs ⚙️

## 🎯 Objetivo

Documentar cómo configurar `@jmlq/logger-plugin-fs` en un host real y cómo integrarlo en el bootstrap de `@jmlq/logger`.

## Crear el datasource con `createFsDatasource`

Configuración mínima:

```ts
import { createFsDatasource } from "@jmlq/logger-plugin-fs";

const fsDatasource = createFsDatasource({
  basePath: "./logs",
});
```

## Configuración real del datasource

Ejemplo completo con la forma usada en un bootstrap de host:

```ts
const fsDatasource = createFsDatasource({
  basePath: envs.logger.LOGGER_FS_PATH,
  fileNamePattern: "app-{yyyy}{MM}{dd}.log",
  rotation: { by: "day" },
  mkdir: true,
  onRotate: (oldPath, newPath) => {
    console.log(
      `   [Rotate] Rotación completada: ${oldPath.absolutePath} → ${newPath.absolutePath}`,
    );
  },
  onError: (err) => {
    console.error("   [Error Handler]", err.message);
  },
});
```

## Opciones disponibles

### `basePath`

Directorio base donde el plugin crea o lee archivos de log.

```ts
basePath: "./logs";
```

### `mkdir`

Si está habilitado, el plugin puede crear el directorio base si no existe.

```ts
mkdir: true;
```

### `fileNamePattern`

Patrón de nombre de archivo. Si no se envía, la factory usa este valor por defecto:

```ts
"app-{yyyy}{MM}{dd}.log";
```

Ejemplos válidos:

```ts
fileNamePattern: "app-{yyyy}{MM}{dd}.log";
fileNamePattern: "auth-{yyyy}-{MM}-{dd}.log";
fileNamePattern: "application.log";
```

### `rotation`

La configuración conecta con `IFileSystemRotationConfig`.

Ejemplos:

```ts
rotation: { by: "day" }
rotation: { by: "none" }
rotation: { by: "size", maxSizeMB: 50, maxFiles: 10 }
```

### `onRotate`

Hook útil para observabilidad operativa.

```ts
onRotate: (oldPath, newPath) => {
  console.log(`${oldPath.absolutePath} -> ${newPath.absolutePath}`);
};
```

### `onError`

Hook centralizado para tratar errores del datasource.

```ts
onError: (err) => {
  console.error(err.message);
};
```

## Adapter recomendado en infrastructure

Ejemplo práctico:

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
      console.log("[logger] Conectado a FS para logs");
      return new FsAdapter(ds);
    } catch (e: any) {
      console.warn("[logger] FS deshabilitado:", e?.message ?? e);
    }
  }

  get datasource(): ILogDatasource {
    return this.ds;
  }
}
```

## Variables de entorno del host

El plugin no trae un lector de `.env`.  
En el host, los valores pueden resolverse así:

```ts
process.env.LOGGER_FS_PATH;
process.env.LOG_LEVEL;
process.env.LOGGER_PII_ENABLED;
process.env.LOGGER_PII_INCLUDE_DEFAULTS;
```

## ✅ Checklist

- [ ] Definir `LOGGER_FS_PATH` o un path equivalente en el host
- [ ] Crear el datasource con `createFsDatasource`
- [ ] Elegir `fileNamePattern`
- [ ] Elegir política de rotación
- [ ] Integrar el datasource en el bootstrap de `@jmlq/logger`

---

## ⬅️ Anterior

- [`arquitectura`](./architecture.md)

## ➡️ Siguiente

- [Integración Express](./integration-express.md)
- [Troubleshooting](./troubleshooting.md)
