import * as fs from "fs";
import * as path from "path";
import { ILogFileEnumeratorPort } from "../../domain/ports";

export class FileSystemLogFileEnumeratorAdapter
  implements ILogFileEnumeratorPort
{
  constructor(private readonly basePath: string) {}

  async listLogFiles(): Promise<string[]> {
    const entries = await fs.promises.readdir(this.basePath, {
      withFileTypes: true,
    });

    return (
      entries
        .filter((e) => e.isFile() && e.name.endsWith(".log"))
        .map((e) => path.join(this.basePath, e.name))
        // opcional: ordenar por nombre para estabilidad
        .sort()
    );
  }
}
