// import type { ILogDatasource } from "@jmlq/logger";

import {
  LogStreamWriterAdapter,
  SystemClockAdapter,
  FileRotatorAdapter,
  FileSystemProviderAdapter,
  SystemFilePathAdapter,
  FsDatasourceAdapter,
  FileSystemLogFileEnumeratorAdapter,
  FileSystemLogFileLineReaderAdapter,
} from "../../infrastructure/adapters";

import {
  PersistLogUseCase,
  RotateIfNeededUseCase,
  AppendLogUseCase,
  EnsureDirectoryUseCase,
  FindLogsUseCase,
} from "../../application/use-cases";

import {
  FileRotationPolicy,
  FileNamePattern,
} from "../../domain/value-objects";

import { ILogDatasource } from "../../domain/ports";
import { IFilesystemDatasourceOptions } from "../types";

/**
 * createFsDatasource
 * -----------------------------------------------------------------------------
 * Composition Root del plugin FS.
 *
 * Responsabilidad:
 * - Construir el grafo de dependencias (VOs, adapters, use-cases)
 * - Exponer un ILogDatasource compatible con @jmlq/logger
 *
 * Clean Architecture:
 * - Vive en infraestructura porque integra con el core externo (@jmlq/logger)
 * - Application/domain permanecen sin dependencias externas.
 */
export function createFsDatasource(
  options: IFilesystemDatasourceOptions
): ILogDatasource {
  // ---------------------------------------------------------------------------
  // 1) Value Objects (dominio)
  // ---------------------------------------------------------------------------
  const fileNamePattern = new FileNamePattern(
    options.fileNamePattern || "app-{yyyy}{MM}{dd}.log"
  );

  const rotationPolicy = new FileRotationPolicy(
    options.rotation?.by || "day",
    options.rotation?.maxSizeMB,
    options.rotation?.maxFiles
  );

  // ---------------------------------------------------------------------------
  // 2) Adapters (infraestructura)
  // ---------------------------------------------------------------------------
  const clock = new SystemClockAdapter();
  const filePath = new SystemFilePathAdapter();
  const fsProvider = new FileSystemProviderAdapter();
  const writer = new LogStreamWriterAdapter();

  const fileRotator = new FileRotatorAdapter(
    fsProvider,
    filePath,
    fileNamePattern,
    options.basePath
  );

  // ---------------------------------------------------------------------------
  // 3) Use-cases (application)
  //    Nota: no se "exponen" fuera; PersistLog orquesta todo.
  // ---------------------------------------------------------------------------
  const ensureDirectoryUseCase = new EnsureDirectoryUseCase(
    fsProvider,
    options.basePath,
    options.mkdir
  );

  const appendLogUseCase = new AppendLogUseCase(writer);

  const rotateIfNeededUseCase = new RotateIfNeededUseCase(
    fileRotator,
    writer,
    options.onRotate
  );

  const persistLogUseCase = new PersistLogUseCase(
    clock,
    fileRotator,
    writer,
    rotationPolicy,
    rotateIfNeededUseCase,
    appendLogUseCase,
    ensureDirectoryUseCase,
    options.onError
  );

  // 3.x) FindLogs use-case + IO
  const fileEnumerator = new FileSystemLogFileEnumeratorAdapter(
    options.basePath
  );
  const lineReader = new FileSystemLogFileLineReaderAdapter();

  const findLogsUseCase = new FindLogsUseCase({ fileEnumerator, lineReader });

  // ---------------------------------------------------------------------------
  // 4) Adapter que expone el contrato del core (@jmlq/logger)
  // ---------------------------------------------------------------------------
  return new FsDatasourceAdapter(persistLogUseCase, writer, findLogsUseCase);
}
