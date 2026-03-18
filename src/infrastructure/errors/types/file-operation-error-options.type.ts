import { FileOperation, FsErrorScope } from ".";

export type FileOperationErrorOptions = {
  // Identidad / clasificación
  scope?: FsErrorScope;

  // Caso I/O normal
  operation: FileOperation;
  filePath?: string;

  // Causa + mensaje
  cause?: unknown;
  message?: string;
};
