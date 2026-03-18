import {
  ISystemClockPort,
  ILogStreamWriterPort,
  IFileRotatorPort,
} from "../../domain/ports";
import { SaveLogRequest } from "../../domain/request";
import {
  IAppendLogUseCase,
  IEnsureDirectoryUseCase,
  IRotateIfNeededUseCase,
} from ".";
import { FileRotationPolicy } from "../../domain/value-objects";

/**
 * Contrato del caso de uso principal para persistir logs.
 */
export interface IPersistLogUseCase {
  execute(dto: SaveLogRequest): Promise<void>;
}

/**
 * PersistLogUseCase
 * -----------------------------------------------------------------------------
 * Caso de uso de Application que orquesta el flujo completo:
 * - asegura el directorio base
 * - decide si rota según política y fecha actual
 * - garantiza que el stream está abierto en el archivo correcto
 * - escribe el log (append)
 *
 * Nota (Clean Architecture):
 * - No hace IO directamente: todo IO va por ports/use-cases delegados.
 * - Centraliza la secuencia y manejo de errores del flujo.
 */
export class PersistLogUseCase implements IPersistLogUseCase {
  constructor(
    /**
     * Port para obtener la hora actual
     */
    private readonly systemClock: ISystemClockPort,
    /**
     * Port relacionado con rotación/naming (según diseño actual).
     * Idealmente: la parte de naming debería estar separada en un "namer".
     */
    private readonly fileRotator: IFileRotatorPort,
    /**
     * Writer por stream
     */
    private readonly streamWriter: ILogStreamWriterPort,
    /**
     * Política de rotación (VO de dominio).
     */
    private readonly rotationPolicy: FileRotationPolicy,
    /**
     * Use-case que ejecuta rotación si corresponde
     */
    private readonly rotateIfNeededUseCase: IRotateIfNeededUseCase,
    /**
     * Use-case que serializa y escribe el log al stream.
     */
    private readonly appendLogUseCase: IAppendLogUseCase,
    /**
     * Use-case que asegura que el directorio base exista.
     */
    private readonly ensureDirectoryUseCase: IEnsureDirectoryUseCase,
    /**
     * Hook opcional para reportar/registrar errores antes de relanzarlos.
     */
    private readonly onError?: (error: Error) => void | Promise<void>
  ) {}

  /**
   * Ejecuta el flujo principal de persistencia del log.
   */
  async execute(dto: SaveLogRequest): Promise<void> {
    try {
      // 1) Asegurar que el directorio base existe (si está habilitado)
      await this.ensureDirectoryUseCase.execute();
      // 2) Obtener "ahora" desde un port (testable)
      const currentDate = this.systemClock.now();

      // 3) Verificar si corresponde rotar según política/fecha
      await this.rotateIfNeededUseCase.execute({
        currentDate,
        rotationPolicy: this.rotationPolicy,
      });

      // 4) Asegurar que el stream esté abierto en la ruta esperada
      const expectedPath = this.fileRotator.getExpectedPathForDate(currentDate);
      const currentPath = this.streamWriter.getCurrentPath();

      // Reabrir si:
      // - no está abierto
      // - no hay path actual
      // - el path actual no coincide con el esperado (por fecha/patrón)
      if (
        // Cerrar si estaba abierto (evita handles colgando)
        !this.streamWriter.isOpen() ||
        !currentPath ||
        !currentPath.equals(expectedPath)
      ) {
        if (this.streamWriter.isOpen()) {
          await this.streamWriter.close();
        }
        // Abrir stream al archivo esperado
        await this.streamWriter.open(expectedPath);
      }

      // 5) Escribir el log (serialización + newline + write)
      await this.appendLogUseCase.execute(dto);
    } catch (error) {
      // Hook opcional (log/metrics), pero se relanza el error para no ocultarlo
      if (this.onError) {
        await this.onError(error as Error);
      }
      throw error;
    }
  }
}
