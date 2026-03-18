export type FilePathKind = "file" | "dir";

/**
 * Props requeridas para construir un FilePath.
 *
 * Importante:
 * - Estas props representan una ruta YA normalizada.
 * - La responsabilidad de construir valores coherentes
 *   (resolver path, separar directorio, basename, extensión, etc.)
 *   recae en la capa de infraestructura (adapters).
 */
export interface IFilePathProps {
  /**
   * Ruta absoluta completa del archivo.
   * Ej: "/var/log/app/app-20251215.log"
   */
  absolutePath: string;

  /**
   * Directorio contenedor del archivo.
   * Ej: "/var/log/app"
   */
  directory: string;

  /**
   * Nombre completo del archivo (basename + extensión).
   * Ej: "app-20251215.log"
   */
  filename: string | null;

  /**
   * Extensión del archivo.
   * Regla de dominio: debe ser string (puede ser vacío si no aplica).
   * Ej: "log"
   */
  extension: string | null;

  /**
   * Nombre base del archivo sin extensión.
   * Ej: "app-20251215"
   */
  basename: string | null;

  // Define explícitamente qué representa
  kind: FilePathKind;
}

/**
 * FilePath (Value Object)
 * -----------------------------------------------------------------------------
 * Representa una ruta de archivo ya normalizada e inmutable.
 *
 * Características (DDD / Clean Architecture):
 * - Es un Value Object (igualdad por valor).
 * - No depende de Node.js ni del módulo `path`.
 * - No realiza IO ni lógica de infraestructura.
 * - Asume que la normalización fuerte ocurre en adapters.
 *
 * Su responsabilidad es:
 * - Encapsular el concepto de "ruta de archivo válida"
 * - Proteger invariantes básicas (no null, no vacío)
 * - Exponer acceso seguro a sus partes
 */
export class FilePath {
  // Ruta absoluta completa (valor principal del VO)
  private readonly _absolutePath: string;

  // Directorio contenedor del archivo
  private readonly _directory: string;

  // Nombre completo del archivo (con extensión)
  private readonly _filename: string | null;

  // Extensión del archivo
  private readonly _extension: string | null;

  // Nombre base del archivo (sin extensión)
  private readonly _basename: string | null;

  /**
   * Crea un FilePath a partir de props ya normalizadas.
   *
   * Nota de diseño:
   * - Este constructor NO calcula rutas ni usa `path`.
   * - Solo valida invariantes mínimas del dominio.
   */
  constructor(props: IFilePathProps) {
    const { absolutePath, directory, filename, extension, basename, kind } =
      props;

    // Validación de ruta absoluta
    if (
      !absolutePath ||
      typeof absolutePath !== "string" ||
      !absolutePath.trim()
    ) {
      throw new Error("FilePath: absolutePath must be a non-empty string");
    }

    // Validación de directorio
    if (!directory || typeof directory !== "string" || !directory.trim()) {
      throw new Error("FilePath: directory must be a non-empty string");
    }

    if (kind !== "file" && kind !== "dir") {
      throw new Error('FilePath: kind must be "file" or "dir"');
    }

    if (kind === "file") {
      // Validación de filename completo
      if (!filename || typeof filename !== "string" || !filename.trim()) {
        throw new Error("FilePath: filename must be a non-empty string");
      }

      // Validación de extensión (puede ser vacía, pero debe ser string)
      if (typeof extension !== "string") {
        throw new Error("FilePath: extension must be a string");
      }

      // Validación de basename
      if (!basename || typeof basename !== "string" || !basename.trim()) {
        throw new Error("FilePath: basename must be a non-empty string");
      }
    }

    // Asignación inmutable
    this._absolutePath = absolutePath;
    this._directory = directory;
    this._filename = filename;
    this._extension = extension;
    this._basename = basename;
  }

  /**
   * Valor principal del Value Object.
   * Alias explícito de `absolutePath` para uso genérico.
   */
  get value(): string {
    return this._absolutePath;
  }

  /**
   * Ruta absoluta completa del archivo.
   */
  get absolutePath(): string {
    return this._absolutePath;
  }

  /**
   * Directorio contenedor del archivo.
   */
  get directory(): string {
    return this._directory;
  }

  get filename(): string | null {
    return this._filename;
  }

  get extension(): string | null {
    return this._extension;
  }

  get basename(): string | null {
    return this._basename;
  }

  /**
   * Comparación por valor.
   * Dos FilePath son iguales si representan la misma ruta absoluta.
   */
  equals(other: FilePath): boolean {
    return this._absolutePath === other._absolutePath;
  }
}
