import type {
  ILogDatasource,
  LogEntry as CoreLogEntry,
  LogSearchRequest,
  LogRecord,
} from "@jmlq/logger";

import type {
  FindLogsUseCase,
  IPersistLogUseCase,
} from "../../application/use-cases";
import type { ILogStreamWriterPort } from "../../domain/ports";

// Si tu use-case usa request interno (ej: { log: DomainLogEntry })
import type { SaveLogRequest } from "../../domain/request";

export class FsDatasourceAdapter implements ILogDatasource {
  public readonly name = "fs";

  constructor(
    private readonly persistLogUseCase: IPersistLogUseCase,
    private readonly streamWriterPort: ILogStreamWriterPort,
    private readonly findLogsUseCase?: FindLogsUseCase
  ) {}

  /**
   * Firma EXACTA requerida por @jmlq/logger:
   * save(log: LogEntry): Promise<void>
   */
  async save(log: CoreLogEntry): Promise<void> {
    const dto: SaveLogRequest = {
      log,
    };

    await this.persistLogUseCase.execute(dto);
  }

  /**
   * Firma típica de @jmlq/logger (si existe en tu interface):
   * find?(filter?: LogFilterRequest): Promise<ILogResponse[]>
   *
   * Por ahora, dejamos una implementación mínima coherente:
   * - Si aún no soportas lectura, devuelve [] (o lanza un error explícito).
   * - Te recomiendo implementar find en serio (tail/list+parse) como acordamos.
   */
  async find?(filter?: LogSearchRequest): Promise<LogRecord[]> {
    if (!this.findLogsUseCase) return [];

    // mapeo 1:1 (misma estructura)
    const internalFilter = filter as unknown as LogSearchRequest;

    const internal = (await this.findLogsUseCase.execute(
      internalFilter
    )) as unknown as LogRecord[];

    // mapeo 1:1
    return internal as unknown as LogRecord[];
  }

  async flush(): Promise<void> {
    await this.streamWriterPort.flush();
  }

  async dispose(): Promise<void> {
    await this.streamWriterPort.close();
  }
}
