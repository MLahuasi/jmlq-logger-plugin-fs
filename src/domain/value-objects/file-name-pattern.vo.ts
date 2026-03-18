/**
 * FileNamePattern (Value Object)
 * -----------------------------------------------------------------------------
 * Representa un patrón de nombrado de archivos de log.
 *
 * Ejemplos:
 * - "app.log"
 * - "app-{yyyy}{MM}{dd}.log"
 *
 * Responsabilidades:
 * - Garantizar invariantes (string no vacío, sin solo espacios)
 * - Exponer el patrón inmutable
 * - Ofrecer operaciones de dominio relacionadas (tokens)
 */
export class FileNamePattern {
  private readonly _pattern: string;
  /**
   * Regex base para capturar tokens: "{...}"
   * Centralizarlo evita inconsistencias entre métodos.
   */
  private static readonly TOKEN_REGEX = /\{([^}]+)\}/g;

  /**
   * Crea un patrón válido.
   * Invariante: debe ser string no vacío y no solo whitespace.
   */
  constructor(pattern: string) {
    if (typeof pattern !== "string") {
      throw new Error("FileNamePattern: pattern must be a non-empty string");
    }

    const trimmed = pattern.trim();
    if (!trimmed) {
      throw new Error("FileNamePattern: pattern must be a non-empty string");
    }

    this._pattern = trimmed;
  }

  /**
   * Retorna el valor inmutable del patrón.
   */
  get pattern(): string {
    return this._pattern;
  }

  /**
   * Devuelve todos los tokens encerrados en llaves presentes en el patrón.
   * Ej: "app-{yyyy}{MM}.log" => ["yyyy", "MM"]
   */
  getTokens(): string[] {
    const matches = this._pattern.match(FileNamePattern.TOKEN_REGEX);
    return matches ? matches.map((m) => m.slice(1, -1)) : [];
  }
}
