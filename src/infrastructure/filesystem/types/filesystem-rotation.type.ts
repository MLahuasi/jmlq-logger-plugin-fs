import { FsRotationBy } from "../../../domain/types";

/**
 * Representa la configuración que el sistema de log debe seguir para decidir cuándo rotar archivos.
 * by: Estrategia principal de rotación: "none", "day", "size".
 * maxSizeMB: Tamaño máximo del archivo antes de rotar (solo aplica si by === "size").
 * maxFiles: Cuántos archivos rotados se mantienen. Ejemplo: si maxFiles = 5, se mantienen:
 */
export interface IFileSystemRotationConfig {
  by: FsRotationBy;
  maxSizeMB?: number;
  maxFiles?: number;
}
