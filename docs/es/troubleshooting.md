# Troubleshooting — @jmlq/logger-plugin-fs 🩺

## 🎯 Objetivo

Resolver problemas comunes al integrar `@jmlq/logger-plugin-fs` en un host Express u otro host Node.js.

## 1) No se crea el directorio de logs

Revisa:

- `basePath` apunta a una ruta válida.
- `mkdir` esté habilitado si esperas creación automática.
- el proceso tenga permisos de escritura.

Ejemplo esperado:

```ts
createFsDatasource({
  basePath: "./logs",
  mkdir: true,
});
```

## 2) El plugin no rota archivos

Revisa la política real configurada:

```ts
rotation: { by: "day" }
rotation: { by: "size", maxSizeMB: 50, maxFiles: 10 }
rotation: { by: "none" }
```

Causas comunes:

- `by: "none"` desactiva rotación.
- en `size`, falta `maxSizeMB`.
- el patrón de archivo no cambia cuando esperas rotación por día.

## 3) `FsAdapter.create(...)` devuelve `undefined`

En el patrón de adapter documentado, eso ocurre cuando `createFsDatasource(...)` lanza error y el adapter lo captura.

Revisa:

- `basePath`
- permisos del proceso
- configuración de `rotation`
- errores impresos por `console.warn("[logger] FS deshabilitado:", ...)`

## 4) No encuentras logs con `find(...)`

Revisa:

- que realmente existan archivos `.log` en `basePath`,
- que cada línea sea JSON parseable,
- filtros de fecha, nivel o query demasiado restrictivos.

## 5) El proceso termina y se pierden líneas recientes

Ejecuta `flush()` antes del cierre ordenado del proceso.

Ejemplo:

```ts
await flushLogs();
```

## ✅ Checklist

- [ ] Verificar `basePath`
- [ ] Verificar `mkdir`
- [ ] Verificar política `rotation`
- [ ] Revisar permisos de escritura
- [ ] Ejecutar `flush()` en shutdown

---

## ⬅️ Anterior

- [`arquitectura`](./architecture.md)

## ➡️ Siguiente

- [Configuración](./configuration.md)
- [Integración Express](./integration-express.md)
