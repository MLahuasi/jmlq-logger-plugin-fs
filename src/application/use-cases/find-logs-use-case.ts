import { LogFilterRequest } from "../../domain/request";
import {
  ILogFileEnumeratorPort,
  ILogFileLineReaderPort,
} from "../../domain/ports";
import { ILogResponse } from "../../domain/response";

export interface IFindLogsUseCase {
  execute(filter?: LogFilterRequest): Promise<ILogResponse[]>;
}

export class FindLogsUseCase implements IFindLogsUseCase {
  constructor(
    private readonly deps: {
      fileEnumerator: ILogFileEnumeratorPort;
      lineReader: ILogFileLineReaderPort;
    }
  ) {}
  async execute(filter?: LogFilterRequest): Promise<ILogResponse[]> {
    // if (!this.ds.find) return [];

    const files = await this.deps.fileEnumerator.listLogFiles();

    const records: ILogResponse[] = [];

    for (const file of files) {
      for await (const line of this.deps.lineReader.readLines(file)) {
        if (!line.trim()) continue;

        let record: ILogResponse;
        try {
          record = JSON.parse(line);
        } catch {
          continue; // línea corrupta → la ignoras
        }

        if (!this.matchesFilter(record, filter)) continue;

        records.push(record);
      }
    }

    return this.applyPagination(records, filter);
  }

  private matchesFilter(r: ILogResponse, f?: LogFilterRequest): boolean {
    if (f?.levelMin != null && r.level < f.levelMin) return false;
    if (f?.since != null && r.timestamp < f.since) return false;
    if (f?.until != null && r.timestamp > f.until) return false;

    if (f?.query?.trim()) {
      const q = f.query.trim().toLowerCase();
      const msgText = this.messageToText(r.message).toLowerCase();
      if (!msgText.includes(q)) return false;
    }

    return true;
  }

  private applyPagination(
    records: ILogResponse[],
    f?: LogFilterRequest
  ): ILogResponse[] {
    const ordered = records.slice().sort((a, b) => a.timestamp - b.timestamp);

    const limit = typeof f?.limit === "number" ? f.limit : ordered.length;
    const page = typeof f?.offset === "number" ? f.offset : 0;

    const slice = ordered.slice(page * limit, page * limit + limit);
    return slice.reverse();
  }

  private messageToText(message: ILogResponse["message"]): string {
    if (typeof message === "string") return message;

    // message es objeto: lo convertimos a string para búsqueda simple
    try {
      return JSON.stringify(message);
    } catch {
      return "";
    }
  }
}
