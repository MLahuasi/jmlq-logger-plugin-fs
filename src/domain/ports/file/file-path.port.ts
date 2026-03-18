import { FilePath } from "../../value-objects";

/**
 * IFilePathPort
 * -----------------------------------------------------------------------------
 * Puerto de dominio para:
 *  1) Construir un FilePath (Value Object) desde entradas string externas.
 *  2) Componer rutas a partir de un FilePath existente.
 *
 * Motivación (Clean Architecture):
 * - El dominio/aplicación NO dependen de `node:path` ni de reglas de OS.
 * - Infraestructura provee un adapter (ej. SystemFilePathAdapter) que implementa esto.
 *
 * Nota de consistencia:
 * - Define y respeta si FilePath en tu dominio es SIEMPRE absoluto o puede ser relativo.
 *   (Si es siempre absoluto, fromRaw debería resolver a absoluto.)
 */
export interface IFilePathPort {
  /**
   * Construye un FilePath a partir de una ruta cruda (relativa o absoluta).
   *
   * Responsabilidades del adapter:
   * - Validar input mínimo (string no vacío).
   * - Normalizar separadores / limpiar.
   * - (Opcional según tu modelo) Resolver a ruta absoluta.
   */
  fromRaw(inputPath: string): FilePath;

  /**
   * Une segmentos a partir de un FilePath base y retorna un nuevo FilePath (inmutable).
   *
   * Caso típico:
   * - basePath (FilePath) + "subdir" + "file.log"
   *
   * Responsabilidades del adapter:
   * - Validar segmentos (no vacíos si aplica).
   * - Normalizar la ruta resultante.
   */
  join(filePath: FilePath, ...segments: string[]): FilePath;
}
