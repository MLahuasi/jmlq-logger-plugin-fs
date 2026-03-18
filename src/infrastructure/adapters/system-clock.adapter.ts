import { ISystemClockPort } from "../../domain/ports";

/**
 * Adapter de infraestructura que implementa IClockPort
 * utilizando el reloj real del sistema.
 *
 * Responsabilidad:
 * - Proveer la fecha y hora actual al sistema.
 *
 * Propósito arquitectónico:
 * - Evitar el uso directo de `new Date()` en dominio y aplicación.
 * - Permitir tests deterministas mediante clocks falsos (FixedClock, MockClock).
 * - Centralizar la noción de "tiempo actual" del sistema.
 *
 * Nota:
 * - No depende de APIs específicas de Node.js.
 * - Funciona en cualquier entorno JavaScript.
 */
export class SystemClockAdapter implements ISystemClockPort {
  /**
   * Retorna la fecha y hora actual del sistema.
   *
   * @returns Date actual (timestamp UTC con representación local).
   */
  now(): Date {
    return new Date();
  }
}
