/**
 * Es un tipo discriminado que define cómo se realizará la rotación de logs dentro del sistema.
 * Los valores significan:
 * "none" → Sin rotación. El archivo crece indefinidamente.
 * "day"  → Rotación diaria (por fecha).
 * "size" → Rotación por tamaño (normalmente basado en maxSizeMB).
 */
export type FsRotationBy = "none" | "day" | "size";
