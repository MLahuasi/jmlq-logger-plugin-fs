import { FileSize, FilePath, FileRotationPolicy } from "../../value-objects";

/**
 * IFileRotatorPort
 * -----------------------------------------------------------------------------
 * Puerto de dominio para consultar información del filesystem necesaria
 * para implementar rotación de archivos (logs) en casos de uso/servicios.
 *
 * Importante (Clean Architecture):
 * - Este port NO debe contener reglas de negocio (p. ej. decidir si rotar).
 * - Debe limitarse a capacidades del mundo externo (filesystem).
 *
 * La decisión de rotación (por fecha/tamaño/política) debe vivir en:
 * - un Domain Service (reglas), o
 * - un Use Case (orquestación), pero no dentro del port.
 */
export interface IFileRotatorPort {
  /**
   * Obtiene el archivo de log "actual" si existe/está determinado
   * por la implementación (por ejemplo, por configuración).
   *
   * Nota:
   * - Si el "current" depende solo de config, considera eliminar esto
   *   y que el caso de uso lo derive desde config/naming.
   */
  getCurrentPath(): FilePath | null;
  /**
   * Calcular cómo se va a llamar el archivo según una fecha
   * @param date Fecha para la que se quiere el path
   */
  getExpectedPathForDate(date: Date): FilePath;

  /**
   * Consulta el tamaño del archivo en filesystem.
   * (IO puro; ideal para políticas de rotación por tamaño).
   */
  getFileSize(filePath: FilePath): Promise<FileSize>;

  /**
   * Decidir si corresponde rotar de acuerdo a una RotationPolicy y la fecha actual
   * @param policy Política de rotación
   * @param currentDate Fecha actual
   */
  shouldRotate(policy: FileRotationPolicy, currentDate: Date): Promise<boolean>;
}
