import {
  FileOperation,
  FileOperationErrorOptions,
  FsErrorScope,
} from "./types";

/**
 * Error especializado para fallos de operaciones de filesystem.
 *
 * Encapsula errores de I/O (read, write, delete, mkdir, move) agregando
 * contexto técnico relevante:
 *   - operation: operación de filesystem que falló.
 *   - filePath: ruta afectada (si aplica).
 *   - cause: error original que provocó el fallo.
 *   - scope: origen del error (por ejemplo, "fs-plugin").
 *
 * Su propósito es:
 *   - Normalizar errores de filesystem dentro del plugin FS.
 *   - Evitar el uso de Error genérico sin contexto.
 *   - Facilitar logging, debugging y traducción a errores de capas superiores.
 *
 * No representa errores de dominio ni de configuración; solo fallos de I/O.
 */
export class FileOperationError extends Error {
  readonly name = "FileOperationError";
  readonly scope?: FsErrorScope;
  // I/O
  readonly operation: FileOperation;
  readonly filePath?: string;
  readonly cause?: unknown;

  constructor(opts: FileOperationErrorOptions) {
    const message =
      opts.message ??
      buildDefaultMessage({
        operation: opts.operation,
        filePath: opts.filePath,
      });

    super(message);
    this.scope = opts.scope;
    this.operation = opts.operation;
    this.filePath = opts.filePath;
    this.cause = opts.cause;
  }

  // ---------------------------------------------------------------------------
  // Factories: I/O
  // ---------------------------------------------------------------------------
  static create(operation: FileOperation, filePath?: string, cause?: unknown) {
    return new FileOperationError({ operation, filePath, cause });
  }

  static fs(operation: FileOperation, filePath?: string, cause?: unknown) {
    return new FileOperationError({
      scope: "fs-plugin",
      operation,
      filePath,
      cause,
    });
  }
}

function buildDefaultMessage(opts: {
  operation?: FileOperation;
  filePath?: string;
}): string {
  // I/O normal

  return `Failed to ${opts.operation} file: ${opts.filePath ?? "(unknown)"}`;
}
