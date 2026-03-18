import { FilePath } from "../../domain/value-objects";
import { IFileSystemRotationConfig } from "../../infrastructure/filesystem/types";

/**
 * Opciones de configuración para la fuente de datos del sistema de archivos.
 * Es el objeto de configuración para un datasource de logs basado en filesystem
 */
export interface IFilesystemDatasourceOptions {
  /**
   * Directorio base donde se van a crear/leer los archivos de log.
   */
  basePath: string;
  /**
   * Indica si se deben crear los directorios padres si no existen
   * Si es true, la implementación puede crear el basePath (con fs.mkdir({ recursive: true })) si no existe.
   * Si es false o undefined, o no lo crea o depende de tu implementación.
   */
  mkdir?: boolean;
  /**
   * Patrón de nombre del archivo de log
   */
  fileNamePattern?: string;
  /**
   * Conecta con la política de rotación: "none" | "day" | "size", tamaño máximo, número de archivos, etc
   */
  rotation?: IFileSystemRotationConfig;

  /**
   * Hook que se dispara cuando se rota un archivo de log. Útil para:
   * - Notificar a otro sistema.
   * - Enviar el archivo rotado a S3.
   * - Hacer limpieza adicional.
   * @param oldPath Ruta del archivo de log antes de la rotación
   * @param newPath Ruta del archivo de log después de la rotación
   * @returns
   */
  onRotate?: (oldPath: FilePath, newPath: FilePath) => void | Promise<void>;
  /**
   * Hook centralizado para manejar errores del datasource:
   * - Loggear en otro canal.
   * - Enviar métricas / alertas.
   * - Evitar que el logger “reviente” la app.
   * @param error Error ocurrido en el datasource
   * @returns
   */
  onError?: (error: Error) => void | Promise<void>;
}
