import { SaveLogRequest } from "../../domain/request";
import { ILogStreamWriterPort } from "../../domain/ports";

/**
 * Contrato del caso de uso: permite ejecutar la operación "append log".
 * Útil si quieres mockearlo en tests o exponerlo vía facade.
 */
export interface IAppendLogUseCase {
  execute(dto: SaveLogRequest): Promise<void>;
}

/**
 * AppendLogUseCase
 * -----------------------------------------------------------------------------
 * Caso de uso de Application que:
 * - toma un log (request model),
 * - lo serializa (serializer opcional o JSON por defecto),
 * - asegura salto de línea,
 * - lo escribe a través de un port (writer por stream).
 *
 * Clean Architecture:
 * - depende de puertos del dominio (ILogStreamWriterPort)
 * - NO depende de infraestructura directamente.
 */
export class AppendLogUseCase implements IAppendLogUseCase {
  constructor(
    // Outbound port hacia infraestructura (writer de stream)
    private readonly logStreamWriter: ILogStreamWriterPort
  ) {}

  /**
   * Ejecuta el caso de uso "append log".
   */
  async execute(dto: SaveLogRequest): Promise<void> {
    const { log } = dto;

    // 1) Serializar el log
    let serializedData: string;
    serializedData = JSON.stringify(log);

    // 2) Asegurar salto de línea para escritura line-by-line
    if (!serializedData.endsWith("\n")) {
      serializedData += "\n";
    }
    // 3) Escribir al stream mediante el port (IO en infraestructura)
    await this.logStreamWriter.write(serializedData);
  }
}
