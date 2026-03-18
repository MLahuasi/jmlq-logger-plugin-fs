export interface ILogFileEnumeratorPort {
  listLogFiles(): Promise<string[]>;
}
