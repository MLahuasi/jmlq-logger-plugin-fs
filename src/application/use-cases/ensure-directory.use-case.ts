import { FileOperationError } from "../../infrastructure/errors";
import { IFileSystemProviderPort } from "../../domain/ports";

/**
 * Contrato del caso de uso: asegura la existencia del directorio base.
 */
export interface IEnsureDirectoryUseCase {
  execute(): Promise<void>;
}

/**
 * EnsureDirectoryUseCase
 * -----------------------------------------------------------------------------
 * Caso de uso de Application que garantiza que exista un directorio.
 *
 * Clean Architecture:
 * - Depende de un port de dominio (IFileSystemProviderPort) para IO.
 * - No depende de infraestructura directamente.
 *
 * Comportamiento:
 * - Si createIfNotExists es false, no hace nada (no side-effects).
 * - Si el directorio no existe, lo crea (recursive).
 */
export class EnsureDirectoryUseCase implements IEnsureDirectoryUseCase {
  constructor(
    /**
     * Port de filesystem
     */
    private readonly fileSystemProvider: IFileSystemProviderPort,
    /**
     * Ruta del directorio base a asegurar.
     * Nota: aquí se usa string; idealmente podría ser un VO (FilePath/DirectoryPath)
     * si tu dominio ya lo maneja.
     */
    private readonly basePath: string,
    /**
     * Flag de configuración: si es false, el caso de uso es no-op.
     */
    private readonly createIfNotExists: boolean = true
  ) {}

  /**
   * Ejecuta la operación:
   * - verifica existencia
   * - crea el directorio si no existe
   * - encapsula errores en un error de dominio
   */
  async execute(): Promise<void> {
    // Si la config indica no crear, salimos sin hacer nada.
    if (!this.createIfNotExists) {
      return;
    }

    try {
      // El basePath ES el directorio que queremos asegurar.
      const exists = await this.fileSystemProvider.exists(this.basePath);

      if (!exists) {
        await this.fileSystemProvider.mkdir(this.basePath, {
          recursive: true,
        });
      }
    } catch (error) {
      // Error de dominio (no infraestructura) para mantener la dirección de dependencias.
      throw FileOperationError.create("mkdir", this.basePath, error);
    }
  }
}
