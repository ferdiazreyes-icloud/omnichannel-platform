import { differenceInMinutes, addMinutes, addHours } from "date-fns";

const SLA_PRIMERA_RESPUESTA_MIN = parseInt(
  process.env.SLA_PRIMERA_RESPUESTA_MIN || "15",
  10
);
const SLA_RESOLUCION_HORAS = parseInt(
  process.env.SLA_RESOLUCION_HORAS || "24",
  10
);

const PRIORIDAD_MULTIPLICADOR: Record<string, number> = {
  alta: 0.5,
  media: 1,
  baja: 2,
};

export function calcularSLAPrimeraRespuesta(
  createdAt: Date,
  prioridad: string
): Date {
  const mult = PRIORIDAD_MULTIPLICADOR[prioridad] ?? 1;
  return addMinutes(createdAt, SLA_PRIMERA_RESPUESTA_MIN * mult);
}

export function calcularSLAResolucion(
  createdAt: Date,
  prioridad: string
): Date {
  const mult = PRIORIDAD_MULTIPLICADOR[prioridad] ?? 1;
  return addHours(createdAt, SLA_RESOLUCION_HORAS * mult);
}

export type SLAStatus = "a_tiempo" | "en_riesgo" | "vencido";

export function evaluarSLA(
  slaDeadline: Date | null,
  completedAt: Date | null
): SLAStatus {
  if (!slaDeadline) return "a_tiempo";
  const now = completedAt ?? new Date();
  const minutesLeft = differenceInMinutes(slaDeadline, now);

  if (minutesLeft < 0) return "vencido";
  if (minutesLeft < 15) return "en_riesgo";
  return "a_tiempo";
}

export function minutosRestantes(slaDeadline: Date | null): number | null {
  if (!slaDeadline) return null;
  return differenceInMinutes(slaDeadline, new Date());
}
