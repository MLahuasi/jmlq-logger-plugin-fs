import * as path from "path";
import { FilePath, IFilePathProps } from "../../domain/value-objects";
import { IFilePathPort } from "../../domain/ports";

/**
 * SystemFilePathAdapter
 * --------------------
 * Adapter de infraestructura que implementa IFilePathPort usando el módulo `path`
 * del entorno de ejecución (típicamente Node.js).
 *
 * Responsabilidad:
 * - Aceptar rutas crudas (relativas o absolutas).
 * - Normalizar y resolver siempre a una ruta absoluta.
 * - Construir y transformar el Value Object FilePath de forma consistente.
 *
 * Nota de diseño:
 * - Este adapter centraliza TODA la lógica "dependiente del sistema" (path/OS).
 * - El dominio no debería usar `path.*` directamente.
 */
export class SystemFilePathAdapter implements IFilePathPort {
  // ---------------------------------------------------------------------------
  // Creación: desde input crudo
  // ---------------------------------------------------------------------------

  /**
   * Crea un FilePath desde una ruta cruda (relativa o absoluta).
   * La implementación:
   * - valida input
   * - normaliza
   * - resuelve a absoluta (path.resolve)
   */
  fromRaw(inputPath: string): FilePath {
    // Validación de entrada: evita valores nulos, no-string o vacíos.
    if (typeof inputPath !== "string") {
      throw new Error(
        "SystemFilePathAdapter.fromRaw: inputPath must be a string"
      );
    }

    const trimmed = inputPath.trim();
    if (!trimmed) {
      throw new Error(
        "SystemFilePathAdapter.fromRaw: inputPath cannot be empty or whitespace"
      );
    }

    // Importante: NO resolvemos aquí y también en buildFromAnyPath.
    // Reducimos redundancia: delegamos la normalización/resolución en un único helper.
    return this.buildFromAnyPath(trimmed);
  }

  // ---------------------------------------------------------------------------
  // Transformaciones: derivar nuevas rutas desde un FilePath existente
  // ---------------------------------------------------------------------------
  /**
   * Une segmentos a la ruta base.
   *
   * Nota importante:
   * - Aquí es clave definir semántica. Para evitar el caso raro:
   *     "/logs/app.log" + "x" -> "/logs/app.log/x"
   *   unimos los segmentos al DIRECTORIO del FilePath.
   *
   * Si tu intención era tratar FilePath como "basePath" que puede ser directorio,
   * entonces tu VO debería representar directorios explícitamente.
   */
  join(filePath: FilePath, ...segments: string[]): FilePath {
    // Unimos respecto al directorio del archivo (semántica segura).
    const fullPath = path.join(filePath.directory, ...segments);
    return this.buildFromAnyPath(fullPath);
  }

  // ---------------------------------------------------------------------------
  // Helper privado: construcción consistente de IFilePathProps
  // ---------------------------------------------------------------------------

  /**
   * Construye un FilePath resolviendo y normalizando en UN SOLO lugar.
   *
   * Redundancia corregida:
   * - Antes se hacía path.resolve() en métodos públicos y también en el builder.
   * - Ahora todos pasan por este helper y aquí se aplica resolve/normalize.
   */
  private buildFromAnyPath(anyPath: string): FilePath {
    const raw = anyPath.trim();
    const isDirHint = /[\\\/]$/.test(raw);
    // Resolver a absoluto y normalizar (maneja ., .., separadores OS, etc.)
    const normalized = path.resolve(anyPath);

    if (isDirHint) {
      // Representa directorio
      return new FilePath({
        kind: "dir",
        absolutePath: normalized,
        directory: normalized, // para dirs, directory = sí mismo
        filename: null,
        extension: null,
        basename: null,
      });
    }

    // Derivar partes a partir de la ruta normalizada.
    const directory = path.dirname(normalized);
    const filename = path.basename(normalized);
    const extension = path.extname(normalized);
    const basename = path.basename(normalized, extension);

    // Props canónicas del VO.
    const props: IFilePathProps = {
      kind: "file",
      absolutePath: normalized,
      directory,
      filename,
      extension,
      basename,
    };
    // Crear VO: aquí el dominio puede validar invariantes adicionales si lo deseas.
    return new FilePath(props);
  }
}
