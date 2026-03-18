import { FileRotationPolicy } from "../../domain/value-objects";

/**
 * DTO de entrada para el caso de uso RotateIfNeeded.
 * - currentDate: fecha/hora actual (inyectada desde un clock para tests deterministas)
 * - rotationPolicy: política de rotación (VO de dominio)
 */
export interface RotateIfNeededRequest {
  currentDate: Date;
  rotationPolicy: FileRotationPolicy;
}
