export interface ILogFileLineReaderPort {
  readLines(filePath: string): AsyncIterable<string>;
}
