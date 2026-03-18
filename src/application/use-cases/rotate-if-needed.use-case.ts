import { ILogStreamWriterPort, IFileRotatorPort } from "../../domain/ports";
import { FilePath } from "../../domain/value-objects";
import { RotateIfNeededRequest } from "../dto";

/**
 * Contrato del caso de uso: retorna el nuevo path si rotó, o null si no rotó.
 */
export interface IRotateIfNeededUseCase {
  execute(dto: RotateIfNeededRequest): Promise<FilePath | null>;
}

/**
 * RotateIfNeededUseCase
 * -----------------------------------------------------------------------------
 * Caso de uso de Application que:
 * - determina si se debe rotar (según policy + fecha)
 * - si aplica, cambia el writer al nuevo archivo (close/open)
 * - ejecuta un hook opcional onRotate(oldPath, newPath)
 *
 * Nota:
 * - Depende de ports (IO indirecto).
 * - Existe potencial de duplicidad si otro use-case también asegura open/close.
 */
export class RotateIfNeededUseCase implements IRotateIfNeededUseCase {
  constructor(
    /**
     * Componente de rotación/naming (según diseño actual).
     */
    private readonly fileRotator: IFileRotatorPort,
    /**
     * Writer por stream usado para cerrar/abrir el archivo activo.
     */
    private readonly fileSystemWriter: ILogStreamWriterPort,
    /**
     * Hook opcional ejecutado cuando efectivamente se rota.
     */
    private readonly onRotate?: (
      oldPath: FilePath,
      newPath: FilePath
    ) => void | Promise<void>
  ) {}

  /**
   * Ejecuta el flujo "rotar si hace falta".
   * Retorna:
   * - null si no corresponde rotar
   * - newPath si rotó (o si el expected path es el nuevo destino)
   */
  async execute(dto: RotateIfNeededRequest): Promise<FilePath | null> {
    const { currentDate, rotationPolicy } = dto;
    // Decide si corresponde rotar (según implementación actual del port)
    const shouldRotate = await this.fileRotator.shouldRotate(
      rotationPolicy,
      currentDate
    );

    if (!shouldRotate) {
      return null;
    }
    // Path anterior (si existe) y path esperado para la fecha actual
    const oldPath = this.fileRotator.getCurrentPath();
    const newPath = this.fileRotator.getExpectedPathForDate(currentDate);
    // Solo si hay cambio real de archivo, se reabre el writer
    if (oldPath && !oldPath.equals(newPath)) {
      await this.fileSystemWriter.close();
      await this.fileSystemWriter.open(newPath);

      if (this.onRotate) {
        await this.onRotate(oldPath, newPath);
      }
    }

    return newPath;
  }
}
