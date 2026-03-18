import {
  IFileSystemProviderPort,
  IFilePathPort,
  IFileRotatorPort,
} from "../../domain/ports";
import {
  FileSize,
  FilePath,
  FileRotationPolicy,
  FileNamePattern,
} from "../../domain/value-objects";

/**
 * Adapter de infraestructura que implementa IFileRotatorPort.
 *
 * Responsabilidad:
 * - Calcular el path esperado del archivo de log en base a una fecha y un FileNamePattern.
 * - Leer metadata real del filesystem (tamaño / listado de archivos).
 * - Decidir si debe rotar (por día o por tamaño) apoyándose en la política del dominio.
 *
 * Nota:
 * - Este adapter mantiene estado mínimo (`currentFilePath`) porque el Port lo requiere.
 *   Aun así, evitamos mutaciones ocultas: solo se actualiza desde getExpectedPathForDate().
 */
export class FileRotatorAdapter implements IFileRotatorPort {
  // Estado mínimo: “archivo actual” según el último cálculo/uso.
  private currentFilePath: FilePath | null = null;
  // Caché: resolvemos basePath una sola vez (en vez de hacerlo por cada operación).
  private readonly baseDir: FilePath;

  // Regex precalculada para encontrar tokens del tipo {yyyy}, {MM}, etc.
  private static readonly TOKEN_REGEX = /\{(yyyy|MM|dd|HH|mm|ss)\}/g;

  constructor(
    // Port de FS (stat, readdir, etc.)
    private readonly fsProvider: IFileSystemProviderPort,
    // Port de paths (normalización, join, resolve, etc.)
    private readonly filePathAdapter: IFilePathPort,
    // VO de dominio: patrón de nombre
    private readonly fileNamePattern: FileNamePattern,
    // Config cruda (normalmente string proveniente de env/config)
    private readonly basePath: string
  ) {
    // Resolver y normalizar basePath una sola vez.
    this.baseDir = this.filePathAdapter.fromRaw(this.basePath);
  }

  /**
   * Devuelve el último archivo considerado “actual” por el rotator.
   * Puede ser null si aún no se ha calculado/solicitado un path.
   */
  getCurrentPath(): FilePath | null {
    return this.currentFilePath;
  }

  /**
   * Calcula el path esperado para una fecha y lo “marca” como archivo actual.
   * OJO: este es el único método que muta currentFilePath a propósito.
   */
  getExpectedPathForDate(date: Date): FilePath {
    const expected = this.computePathForDate(date);
    this.currentFilePath = expected;
    return expected;
  }

  /**
   * Calcula el FilePath esperado para una fecha usando el patrón.
   * Método “puro”: NO muta estado.
   */
  private computePathForDate(date: Date): FilePath {
    // 1) Aplicar reemplazo de tokens al patrón -> obtenemos el nombre del archivo.
    const fileName = this.applyDateTokens(this.fileNamePattern.pattern, date);

    // 2) Unir baseDir + fileName (sin re-resolver basePath en cada llamada).
    return this.filePathAdapter.join(this.baseDir, fileName);
  }

  /**
   * Reemplaza tokens de fecha dentro del patrón (ej. {yyyy}{MM}{dd}) por valores reales.
   */
  private applyDateTokens(pattern: string, date: Date): string {
    // Normalizamos valores una sola vez.
    const yyyy = date.getFullYear().toString();
    const MM = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const HH = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");

    // Reemplazamos usando regex global; más simple y eficiente que loop + new RegExp por token.
    return pattern.replace(FileRotatorAdapter.TOKEN_REGEX, (_m, token) => {
      switch (token) {
        case "yyyy":
          return yyyy;
        case "MM":
          return MM;
        case "dd":
          return dd;
        case "HH":
          return HH;
        case "mm":
          return mm;
        case "ss":
          return ss;
        default:
          // Defensive: no debería ocurrir por la regex.
          return _m;
      }
    });
  }

  /**
   * Obtiene el tamaño del archivo (stat) y lo devuelve como FileSize (VO).
   *
   * Decisión de diseño:
   * - Si stat falla (archivo no existe, permisos, etc.), devolvemos tamaño 0.
   * - Esto evita que el flujo de rotación “reviente” por un fallo de I/O puntual.
   * - Si quieres hacer esto más estricto, aquí podrías lanzar un FileOperationError("read"/"stat", ...).
   */
  async getFileSize(filePath: FilePath): Promise<FileSize> {
    try {
      const stats = await this.fsProvider.stat(filePath.absolutePath);
      return new FileSize(stats.size);
    } catch {
      return new FileSize(0);
    }
  }

  // ---------------------------------------------------------------------------
  // Decisión de rotación
  // ---------------------------------------------------------------------------

  /**
   * Decide si debe rotar basándose en la política del dominio y el estado actual.
   *
   * Nota:
   * - Para rotación por día: comparamos el path actual vs el esperado para la fecha actual.
   * - Para rotación por tamaño: consultamos el tamaño real y delegamos la regla al VO.
   */
  async shouldRotate(
    policy: FileRotationPolicy,
    currentDate: Date
  ): Promise<boolean> {
    switch (policy.by) {
      case "none":
        return false;

      case "day":
        return this.shouldRotateByDay(currentDate);

      case "size":
        return this.shouldRotateBySize(policy);

      default:
        // Defensive: si el tipo llegara corrupto por casting/JS.
        return false;
    }
  }

  /**
   * Rotación por día:
   * - Si no hay currentFilePath, se considera que “debe rotar/crear” para inicializar.
   * - Si el nombre esperado para la fecha actual difiere del actual, debe rotar.
   *
   * Importante:
   * - Este método NO muta currentFilePath (solo calcula).
   */
  private shouldRotateByDay(currentDate: Date): boolean {
    if (!this.currentFilePath) return true;

    const expectedPath = this.computePathForDate(currentDate);
    return !this.currentFilePath.equals(expectedPath);
  }

  /**
   * Rotación por tamaño:
   * - Si no hay currentFilePath, no rotamos (no hay “archivo actual” que evaluar).
   * - Si no hay maxSize en la policy, no rotamos.
   * - Si se puede medir tamaño, delegamos al VO para la regla (>= maxSize).
   */
  private async shouldRotateBySize(
    policy: FileRotationPolicy
  ): Promise<boolean> {
    if (!this.currentFilePath) return false;
    if (!policy.maxSize) return false;

    const currentFileSize = await this.getFileSize(this.currentFilePath);
    return policy.shouldRotateBySize(currentFileSize);
  }
}

/**
 * Escapa caracteres especiales para construir RegExp seguro desde strings (basename/ext).
 */
// function escapeRegExp(input: string): string {
//   return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }
