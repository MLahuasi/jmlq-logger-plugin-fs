import { FileSize } from ".";
import { FsRotationBy } from "../types";

/**
 * FileRotationPolicy (Value Object)
 * -----------------------------------------------------------------------------
 * Encapsula la política de rotación de logs en filesystem.
 *
 * Contiene:
 * - Estrategia de rotación (by): "none" | "day" | "size"
 * - Parámetros opcionales:
 *   - maxSize: umbral de tamaño (solo aplica para "size")
 *   - maxFiles: máximo de archivos rotados a conservar (opcional)
 *
 * Propiedades del VO:
 * - Inmutable
 * - Valida invariantes en el constructor
 * - Incluye comportamiento de dominio relacionado (ej. rotación por tamaño)
 */
export class FileRotationPolicy {
  // Estrategia elegida
  private readonly _by: FsRotationBy;
  // Umbral de tamaño solo si la estrategia es "size"
  private readonly _maxSize?: FileSize;
  // Límite de archivos rotados a conservar (si aplica)
  private readonly _maxFiles?: number;

  /**
   * Crea una política de rotación.
   *
   * Nota:
   * - maxSizeMB se interpreta en megabytes si la estrategia es "size".
   * - Para otras estrategias, maxSizeMB se ignora.
   */
  constructor(by: FsRotationBy, maxSize?: number, maxFiles?: number) {
    // Invariante: si se rota por tamaño, se requiere un maxSize positivo
    if (by === "size" && (maxSize == null || maxSize <= 0)) {
      throw new Error(
        "FileRotationPolicy: maxSizeMB must be positive for size rotation"
      );
    }

    // Invariante: si se define maxFiles, debe ser positivo
    if (maxFiles != null && maxFiles <= 0) {
      throw new Error("FileRotationPolicy: maxFiles must be positive");
    }

    this._by = by;

    // Construcción del VO FileSize a partir de MB (si aplica)
    this._maxSize =
      maxSize != null ? FileSize.fromMegabytes(maxSize) : undefined;

    this._maxFiles = maxFiles;
  }

  /**
   * Estrategia de rotación configurada.
   */
  get by(): FsRotationBy {
    return this._by;
  }

  /**
   * Umbral de tamaño (solo relevante cuando by === "size").
   */
  get maxSize(): FileSize | undefined {
    return this._maxSize;
  }

  /**
   * Máximo de archivos rotados a conservar (opcional).
   */
  get maxFiles(): number | undefined {
    return this._maxFiles;
  }

  /**
   * Indica si, según esta política, corresponde rotar por tamaño.
   * Regla: rota si currentSize >= maxSize.
   *
   * Nota:
   * - No hace IO; asume que alguien ya consultó el tamaño actual.
   */
  shouldRotateBySize(currentSize: FileSize): boolean {
    return this._by === "size" && !!this._maxSize
      ? currentSize.isGreaterThan(this._maxSize) ||
          currentSize.equals(this._maxSize)
      : false;
  }
}
