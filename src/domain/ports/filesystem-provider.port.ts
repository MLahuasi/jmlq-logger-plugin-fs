/**
 * Es una abstracción del sistema de archivos (fs) que la capa de dominio puede solicitar sin depender directamente del módulo fs de Node
 */
export interface IFileSystemProviderPort {
  /**
   * Permite saber si un archivo o carpeta existe
   * @param path Ruta del archivo o directorio
   */
  exists(path: string): Promise<boolean>;
  /**
   * Permite crear directorios
   * @param path Ruta del directorio
   * @param options Opciones de creación. Actualmente solo soporta 'recursive' (Indica si se deben crear directorios padres si no existen)
   */
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  /**
   * Se usa para leer registros existentes
   * @param path Ruta del archivo
   */
  readFile(path: string): Promise<Buffer>;
  /**
   * Se usa para escribir registros nuevos
   * @param path Ruta del archivo
   * @param data Datos a escribir
   */
  writeFile(path: string, data: string | Buffer): Promise<void>;
  /**
   * Se usa para agregar registros nuevos al final del archivo
   * @param path Ruta del archivo
   * @param data Datos a agregar
   */
  appendFile(path: string, data: string | Buffer): Promise<void>;
  /**
   * Permite obtener metadata del archivo o directorio
   * - Ver tamaño actual → política de RotationPolicy.
   * - Ver fecha de modificación → rotación diaria/semanal.
   * @param path Ruta del archivo o directorio
   */
  stat(path: string): Promise<{ size: number; mtime: Date }>;
  /**
   * Necesario para rotación por índice y descubrimiento de archivos app.log.1, app.log.2, etc.
   * @param path Ruta del directorio
   */
  readdir(path: string): Promise<string[]>;
  /**
   * Eliminar archivos antiguos.
   * @param path Ruta del archivo
   */
  unlink(path: string): Promise<void>;
  /**
   * Clave para renombrar archivos cuando rotan.
   * @param oldPath Ruta actual del archivo o directorio
   * @param newPath Nueva ruta del archivo o directorio
   */
  rename(oldPath: string, newPath: string): Promise<void>;
}
