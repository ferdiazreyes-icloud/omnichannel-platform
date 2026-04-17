import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // All cases from last 30 days
  const casos = await prisma.caso.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    include: { agente: true },
  });

  // Cases by state
  const porEstado: Record<string, number> = {};
  const porCanal: Record<string, number> = {};
  const porIntencion: Record<string, number> = {};
  const porPrioridad: Record<string, number> = {};
  const porAgente: Record<string, { nombre: string; activos: number; total: number }> = {};

  let totalPrimeraRespuestaMin = 0;
  let countPrimeraRespuesta = 0;
  let totalResolucionHoras = 0;
  let countResolucion = 0;
  let slaRespuestaCumplido = 0;
  let slaResolucionCumplido = 0;
  let totalCSAT = 0;
  let countCSAT = 0;

  // Daily volume for trend
  const volumeDiario: Record<string, number> = {};

  for (const caso of casos) {
    // By state
    porEstado[caso.estado] = (porEstado[caso.estado] || 0) + 1;

    // By channel
    porCanal[caso.canalOrigen] = (porCanal[caso.canalOrigen] || 0) + 1;

    // By intent
    porIntencion[caso.intencion] = (porIntencion[caso.intencion] || 0) + 1;

    // By priority
    porPrioridad[caso.prioridad] = (porPrioridad[caso.prioridad] || 0) + 1;

    // By agent
    if (caso.agente) {
      if (!porAgente[caso.agente.id]) {
        porAgente[caso.agente.id] = {
          nombre: caso.agente.nombre,
          activos: 0,
          total: 0,
        };
      }
      porAgente[caso.agente.id].total++;
      if (["nuevo", "asignado", "en_curso", "escalado"].includes(caso.estado)) {
        porAgente[caso.agente.id].activos++;
      }
    }

    // First response time
    if (caso.primeraRespuestaAt && caso.createdAt) {
      const minutes =
        (caso.primeraRespuestaAt.getTime() - caso.createdAt.getTime()) /
        (1000 * 60);
      totalPrimeraRespuestaMin += minutes;
      countPrimeraRespuesta++;

      if (
        caso.slaPrimeraRespuesta &&
        caso.primeraRespuestaAt <= caso.slaPrimeraRespuesta
      ) {
        slaRespuestaCumplido++;
      }
    }

    // Resolution time
    if (caso.resolvedAt && caso.createdAt) {
      const hours =
        (caso.resolvedAt.getTime() - caso.createdAt.getTime()) /
        (1000 * 60 * 60);
      totalResolucionHoras += hours;
      countResolucion++;

      if (caso.slaResolucion && caso.resolvedAt <= caso.slaResolucion) {
        slaResolucionCumplido++;
      }
    }

    // CSAT
    if (caso.csat) {
      totalCSAT += caso.csat;
      countCSAT++;
    }

    // Daily volume
    const day = caso.createdAt.toISOString().split("T")[0];
    volumeDiario[day] = (volumeDiario[day] || 0) + 1;
  }

  // Active cases (open)
  const casosActivos = casos.filter((c) =>
    ["nuevo", "asignado", "en_curso", "escalado"].includes(c.estado)
  ).length;

  // SLA at risk
  const casosEnRiesgoSLA = casos.filter((c) => {
    if (["resuelto", "cerrado"].includes(c.estado)) return false;
    if (!c.slaResolucion) return false;
    const minutesLeft =
      (c.slaResolucion.getTime() - now.getTime()) / (1000 * 60);
    return minutesLeft > 0 && minutesLeft < 60;
  }).length;

  // SLA expired
  const casosVencidosSLA = casos.filter((c) => {
    if (["resuelto", "cerrado"].includes(c.estado)) return false;
    if (!c.slaResolucion) return false;
    return c.slaResolucion < now;
  }).length;

  // Conversion by channel
  const conversionPorCanal: Record<string, { total: number; resueltos: number }> = {};
  for (const caso of casos) {
    if (!conversionPorCanal[caso.canalOrigen]) {
      conversionPorCanal[caso.canalOrigen] = { total: 0, resueltos: 0 };
    }
    conversionPorCanal[caso.canalOrigen].total++;
    if (["resuelto", "cerrado"].includes(caso.estado)) {
      conversionPorCanal[caso.canalOrigen].resueltos++;
    }
  }

  // Sort daily volume
  const tendenciaVolumen = Object.entries(volumeDiario)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, cantidad]) => ({ fecha, cantidad }));

  return NextResponse.json({
    resumen: {
      totalCasos: casos.length,
      casosActivos,
      casosEnRiesgoSLA,
      casosVencidosSLA,
      tiempoPromedioPrimeraRespuesta:
        countPrimeraRespuesta > 0
          ? Math.round(totalPrimeraRespuestaMin / countPrimeraRespuesta)
          : 0,
      tiempoPromedioResolucion:
        countResolucion > 0
          ? Math.round((totalResolucionHoras / countResolucion) * 10) / 10
          : 0,
      slaRespuestaCompliance:
        countPrimeraRespuesta > 0
          ? Math.round((slaRespuestaCumplido / countPrimeraRespuesta) * 100)
          : 0,
      slaResolucionCompliance:
        countResolucion > 0
          ? Math.round((slaResolucionCumplido / countResolucion) * 100)
          : 0,
      csatPromedio: countCSAT > 0 ? Math.round((totalCSAT / countCSAT) * 10) / 10 : 0,
    },
    porEstado,
    porCanal,
    porIntencion,
    porPrioridad,
    porAgente: Object.values(porAgente),
    conversionPorCanal,
    tendenciaVolumen,
  });
}
