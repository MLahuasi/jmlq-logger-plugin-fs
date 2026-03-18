/**
 * FileSize (Value Object)
 * -----------------------------------------------------------------------------
 * Representa el tamaño de un archivo, almacenado internamente en bytes.
 *
 * DDD / Clean Architecture:
 * - Inmutable
 * - Igualdad por valor (bytes)
 * - No depende de infraestructura (fs, streams, etc.)
 * - Expone comportamiento de dominio: conversiones y comparaciones
 */
export class FileSize {
  /**
   * Valor interno en bytes.
   * Invariante: entero no negativo.
   */
  private readonly _bytes: number;

  /**
   * Construye un FileSize desde bytes.
   * - bytes debe ser entero no negativo
   */
  constructor(bytes: number) {
    if (bytes < 0 || !Number.isInteger(bytes)) {
      throw new Error("FileSize: bytes must be a non-negative integer");
    }
    this._bytes = bytes;
  }

  /**
   * Bytes exactos (unidad base del VO).
   */
  get bytes(): number {
    return this._bytes;
  }

  /**
   * Tamaño en kilobytes (KiB, base 1024).
   * Nota: retorna number (puede tener decimales).
   */
  get kilobytes(): number {
    return this._bytes / 1024;
  }

  /**
   * Tamaño en megabytes (MiB, base 1024).
   * Nota: retorna number (puede tener decimales).
   */
  get megabytes(): number {
    return this._bytes / (1024 * 1024);
  }

  /**
   * Tamaño en gigabytes (GiB, base 1024).
   * Nota: retorna number (puede tener decimales).
   */
  get gigabytes(): number {
    return this._bytes / (1024 * 1024 * 1024);
  }

  /**
   * Crea un FileSize a partir de megabytes.
   *
   * Nota:
   * - Permite mb con decimales.
   * - Se convierte a bytes y se aplica Math.floor (redondeo hacia abajo).
   */
  static fromMegabytes(mb: number): FileSize {
    if (mb < 0) {
      throw new Error("FileSize: megabytes must be non-negative");
    }
    return new FileSize(Math.floor(mb * 1024 * 1024));
  }

  /**
   * Crea un FileSize a partir de kilobytes.
   *
   * Nota:
   * - Permite kb con decimales.
   * - Se convierte a bytes y se aplica Math.floor (redondeo hacia abajo).
   */
  static fromKilobytes(kb: number): FileSize {
    if (kb < 0) {
      throw new Error("FileSize: kilobytes must be non-negative");
    }
    return new FileSize(Math.floor(kb * 1024));
  }

  /**
   * Comparación: this > other
   */
  isGreaterThan(other: FileSize): boolean {
    return this._bytes > other._bytes;
  }

  /**
   * Comparación: this < other
   */
  isLessThan(other: FileSize): boolean {
    return this._bytes < other._bytes;
  }

  /**
   * Igualdad por valor (bytes exactos).
   */
  equals(other: FileSize): boolean {
    return this._bytes === other._bytes;
  }

  /**
   * Representación legible para logs/diagnóstico.
   * Selecciona la unidad más adecuada y muestra 2 decimales en KB/MB/GB.
   */
  toString(): string {
    if (this._bytes >= 1024 * 1024 * 1024) {
      return `${(this._bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (this._bytes >= 1024 * 1024) {
      return `${(this._bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (this._bytes >= 1024) {
      return `${(this._bytes / 1024).toFixed(2)} KB`;
    }
    return `${this._bytes} bytes`;
  }
}
