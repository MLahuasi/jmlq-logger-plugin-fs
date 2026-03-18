/**
 * Representa una abstracción del reloj del sistema dentro de la capa domain.
 * Su único propósito es permitir que el dominio pueda obtener la hora actual
 * sin depender directamente de new Date() ni de Date.now()
 */
export interface ISystemClockPort {
  now(): Date;
}
