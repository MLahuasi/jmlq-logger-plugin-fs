import { createWriteStream, WriteStream } from "fs";
import { ILogStreamWriterPort } from "../../domain/ports";
import { FilePath } from "../../domain/value-objects";
import { FileOperationError } from "../errors";

/**
 * Adapter de infraestructura que implementa IStreamWriterPort
 * usando streams de escritura de Node.js.
 *
 * Responsabilidad:
 * - Gestionar el ciclo de vida de un WriteStream (open → write → flush → close).
 * - Manejar backpressure correctamente usando el evento "drain".
 * - Encapsular errores de I/O en FileOperationError.
 *
 * Este adapter NO:
 * - Decide cuándo rotar.
 * - Decide qué escribir.
 * - Conoce reglas de negocio.
 *
 * Solo escribe datos de forma eficiente.
 */
export class LogStreamWriterAdapter implements ILogStreamWriterPort {
  /**
   * Stream activo de escritura.
   * Es null cuando no hay archivo abierto.
   */
  private stream: WriteStream | null = null;
  /**
   * Ruta del archivo actualmente abierto.
   * Se mantiene para:
   * - diagnóstico
   * - errores más informativos
   */
  private currentPath: FilePath | null = null;

  // ---------------------------------------------------------------------------
  // Escritura
  // ---------------------------------------------------------------------------

  /**
   * Escribe datos en el stream actual.
   *
   * Maneja backpressure:
   * - Si write() devuelve false, espera al evento "drain".
   *
   * @param data Cadena a escribir (ya serializada).
   * @returns true cuando la escritura fue aceptada por el stream.
   */
  async write(data: string): Promise<boolean> {
    // Protección: no se puede escribir sin haber abierto un stream
    if (!this.stream) {
      throw FileOperationError.fs(
        "write",
        this.currentPath?.absolutePath,
        "Stream not opened"
      );
    }

    return new Promise((resolve, reject) => {
      // write() devuelve false si el buffer interno está lleno
      const accepted = this.stream!.write(data);

      if (!accepted) {
        // Esperar a que el buffer se drene
        this.stream!.once("drain", () => resolve(true));
        // Error del stream (I/O real)
        this.stream!.once("error", reject);
      } else {
        resolve(true);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Apertura
  // ---------------------------------------------------------------------------

  /**
   * Abre un archivo para escritura en modo append.
   *
   * Si ya existe un stream abierto:
   * - Se cierra primero de forma segura.
   *
   * @param path FilePath del archivo a abrir.
   */
  async open(path: FilePath): Promise<void> {
    // Si hay un stream previo, cerrarlo primero
    if (this.stream) {
      await this.close();
    }

    const pathString = path.absolutePath;

    // Creamos el stream, pero NO lo asignamos todavía
    const stream = createWriteStream(pathString, { flags: "a" });

    return new Promise((resolve, reject) => {
      // El evento "open" garantiza que el archivo está listo
      stream.once("open", () => {
        this.stream = stream;
        this.currentPath = path;
        resolve();
      });

      // Error durante apertura (permisos, path inválido, etc.)
      stream.once("error", (err) => {
        reject(FileOperationError.fs("write", pathString, err));
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Cierre
  // ---------------------------------------------------------------------------

  /**
   * Cierra el stream actual de forma ordenada.
   *
   * - Llama a stream.end().
   * - Limpia el estado interno.
   *
   * Es seguro llamar varias veces.
   */
  async close(): Promise<void> {
    if (!this.stream) return;

    return new Promise((resolve) => {
      this.stream!.end(() => {
        this.stream = null;
        this.currentPath = null;
        resolve();
      });
    });
  }

  /**
   * Alias semántico de close().
   * Útil cuando el writer se usa como “sink” final.
   */
  async end(): Promise<void> {
    return this.close();
  }

  /**
   * Espera a que el buffer interno del stream se vacíe.
   *
   * No fuerza fsync; solo asegura que el buffer JS esté drenado.
   */
  async flush(): Promise<void> {
    if (!this.stream) return;

    return new Promise((resolve) => {
      if (this.stream!.writableNeedDrain) {
        this.stream!.once("drain", () => resolve());
      } else {
        resolve();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------------------

  /**
   * Indica si hay un stream abierto actualmente.
   */
  isOpen(): boolean {
    return this.stream !== null;
  }

  /**
   * Devuelve la ruta del archivo actualmente abierto.
   * Puede ser null si no hay stream activo.
   */
  getCurrentPath(): FilePath | null {
    return this.currentPath;
  }
}
