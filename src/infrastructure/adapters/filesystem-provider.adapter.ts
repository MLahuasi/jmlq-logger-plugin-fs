import * as fs from "fs/promises";
import { IFileSystemProviderPort } from "../../domain/ports";

/**
 * Adapter de infraestructura que implementa IFsProviderPort
 * utilizando la API nativa de Node.js (fs/promises).
 *
 * Responsabilidad:
 * - Encapsular el acceso al filesystem real.
 * - Traducir operaciones de alto nivel del Port (exists, read, write, etc.)
 *   a llamadas concretas de Node.js.
 *
 * Beneficios:
 * - Aísla el dominio y la capa de aplicación de Node.js.
 * - Permite testear fácilmente mediante mocks del port.
 * - Facilita reemplazar esta implementación (memfs, fs remoto, etc.).
 */
export class FileSystemProviderAdapter implements IFileSystemProviderPort {
  /**
   * Verifica si una ruta existe y es accesible.
   *
   * Decisión de diseño:
   * - Se usa fs.access() porque es una operación liviana.
   * - Si ocurre cualquier error (no existe, permisos, etc.),
   *   se interpreta como "no accesible".
   *
   * Nota:
   * - Esto no distingue entre "no existe" y "sin permisos".
   * - Para casos más estrictos, podría usarse fs.stat() y revisar el código de error.
   */
  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Crea un directorio en el filesystem.
   *
   * @param path Ruta del directorio a crear.
   * @param options Opciones de creación (por ejemplo, recursive).
   *
   * Decisión de diseño:
   * - Se delega completamente en fs.mkdir().
   * - No se captura el error: si falla, el error debe propagarse
   *   para que la capa superior decida cómo manejarlo.
   */
  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await fs.mkdir(path, options);
  }

  /**
   * Lee el contenido completo de un archivo.
   *
   * @param path Ruta absoluta del archivo.
   * @returns Buffer con el contenido del archivo.
   *
   * Nota:
   * - El adapter no interpreta el contenido (texto/binario).
   * - La capa superior decide cómo procesar el Buffer.
   */
  async readFile(path: string): Promise<Buffer> {
    return fs.readFile(path);
  }

  /**
   * Escribe datos en un archivo, reemplazando su contenido si existe.
   *
   * @param path Ruta absoluta del archivo.
   * @param data Contenido a escribir (string o Buffer).
   *
   * Decisión de diseño:
   * - Usa fs.writeFile(), que crea el archivo si no existe.
   * - Errores de escritura se propagan.
   */
  async writeFile(path: string, data: string | Buffer): Promise<void> {
    await fs.writeFile(path, data);
  }

  /**
   * Agrega datos al final de un archivo existente.
   *
   * @param path Ruta absoluta del archivo.
   * @param data Contenido a agregar.
   *
   * Nota:
   * - Si el archivo no existe, fs.appendFile() lo crea.
   */
  async appendFile(path: string, data: string | Buffer): Promise<void> {
    await fs.appendFile(path, data);
  }

  /**
   * Obtiene información básica de un archivo.
   *
   * @param path Ruta absoluta del archivo.
   * @returns Objeto reducido con:
   *   - size: tamaño del archivo en bytes.
   *   - mtime: fecha de última modificación.
   *
   * Decisión de diseño:
   * - Se expone solo la metadata necesaria para el dominio/app.
   * - No se filtra el objeto fs.Stats completo para evitar acoplamiento.
   */
  async stat(path: string): Promise<{ size: number; mtime: Date }> {
    const stats = await fs.stat(path);
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  /**
   * Lista los archivos y carpetas dentro de un directorio.
   *
   * @param path Ruta absoluta del directorio.
   * @returns Array de nombres (no rutas completas).
   *
   * Nota:
   * - Se devuelve string[] porque el dominio no necesita fs.Dirent.
   */
  async readdir(path: string): Promise<string[]> {
    return fs.readdir(path);
  }

  /**
   * Elimina un archivo del filesystem.
   *
   * @param path Ruta absoluta del archivo a eliminar.
   *
   * Decisión de diseño:
   * - No se captura el error: si falla, la capa superior debe decidir
   *   cómo manejar la situación (log, retry, ignore, etc.).
   */
  async unlink(path: string): Promise<void> {
    await fs.unlink(path);
  }

  /**
   * Renombra o mueve un archivo dentro del filesystem.
   *
   * @param oldPath Ruta actual del archivo.
   * @param newPath Nueva ruta del archivo.
   *
   * Nota:
   * - fs.rename() puede usarse tanto para renombrar como para mover archivos.
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    await fs.rename(oldPath, newPath);
  }
}
