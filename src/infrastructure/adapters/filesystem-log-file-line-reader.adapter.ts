import * as fs from "fs";
import * as readline from "readline";
import { ILogFileLineReaderPort } from "../../domain/ports";

export class FileSystemLogFileLineReaderAdapter
  implements ILogFileLineReaderPort
{
  async *readLines(filePath: string): AsyncIterable<string> {
    const stream = fs.createReadStream(filePath, { encoding: "utf8" });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    try {
      for await (const line of rl) yield line;
    } finally {
      rl.close();
      stream.close();
    }
  }
}
