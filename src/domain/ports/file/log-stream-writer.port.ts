import { FilePath } from "../../value-objects";

/**
 * IFileSystemWriterPort
 * -----------------------------------------------------------------------------
 * Puerto de salida (Outbound Port) que abstrae un writer basado en stream.
 *
 * Uso típico:
 *  - open(path)
 *  - write(line)
 *  - flush() (opcional, antes de rotar o cerrar)
 *  - close() (cerrar el stream actual, con posibilidad de reabrir)
 *  - end()   (finalizar definitivamente / liberar recursos)
 *
 * Implementación típica en infraestructura:
 *  - Node.js fs.createWriteStream + manejo de backpressure ("drain")
 */
export interface ILogStreamWriterPort {
  /**
   * Escribe datos al stream actual.
   *
   * Retorna:
   * - true: la escritura fue aceptada sin saturar el buffer
   * - false: hay backpressure (buffer lleno) y conviene esperar antes de seguir
   *
   * Nota de diseño:
   * - Si la implementación "await" internamente hasta que drene, el boolean pierde valor.
   *   En ese caso considera devolver Promise<void> y ocultar backpressure.
   */
  write(data: string): Promise<boolean>;
  /**
   * Abre un stream para un archivo específico.
   * Debe dejar el writer listo para recibir write().
   */
  open(filePath: FilePath): Promise<void>;
  /**
   * Cierra el stream actual (si existe) SIN implicar "dispose definitivo".
   * Útil para rotación: cerrar -> renombrar -> open(nuevo).
   *
   * Recomendación:
   * - Define claramente si close() es idempotente (llamar dos veces no falla).
   */
  close(): Promise<void>;
  /**
   * Fuerza a que todo lo pendiente se escriba antes de continuar.
   *
   * Importante:
   * - Define qué garantiza: ¿solo vaciar buffer en memoria? ¿fsync a disco?
   * - Es clave si la rotación requiere consistencia antes de renombrar/mover.
   */
  flush(): Promise<void>;
  /**
   * Indica si el writer está abierto y listo para recibir escrituras.
   * Útil para evitar errores por write() sin open().
   */
  isOpen(): boolean;
  /**
   * Devuelve el FilePath actualmente abierto para escritura, o null si no hay.
   * Útil para diagnóstico o para decidir rotación desde la aplicación.
   */
  getCurrentPath(): FilePath | null;
  /**
   * Finaliza definitivamente el writer.
   * Debe liberar recursos y dejar el objeto en estado no reutilizable
   * (o al menos documentar si se puede reabrir).
   *
   * Recomendación:
   * - Aclara la diferencia exacta con close().
   */
  end(): Promise<void>;
}
