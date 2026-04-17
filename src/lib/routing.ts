import { prisma } from "./db";
import {
  calcularSLAPrimeraRespuesta,
  calcularSLAResolucion,
} from "./sla";

const EQUIPO_POR_INTENCION: Record<string, string> = {
  venta: "ventas",
  soporte: "soporte",
  cobranza: "cobranza",
  informacion: "general",
};

export async function asignarCaso(casoId: string) {
  const caso = await prisma.caso.findUnique({ where: { id: casoId } });
  if (!caso) throw new Error("Caso no encontrado");

  const equipo = EQUIPO_POR_INTENCION[caso.intencion] || "general";

  // Find agent with least active cases in the matching team
  const agentes = await prisma.agente.findMany({
    where: { equipo, activo: true },
    include: {
      casos: {
        where: {
          estado: { in: ["nuevo", "asignado", "en_curso"] },
        },
      },
    },
  });

  if (agentes.length === 0) {
    // Fallback: try general pool
    const generales = await prisma.agente.findMany({
      where: { activo: true },
      include: {
        casos: {
          where: {
            estado: { in: ["nuevo", "asignado", "en_curso"] },
          },
        },
      },
    });

    if (generales.length === 0) return null;

    generales.sort((a, b) => a.casos.length - b.casos.length);
    const agente = generales[0];

    return prisma.caso.update({
      where: { id: casoId },
      data: {
        agenteId: agente.id,
        estado: "asignado",
        slaPrimeraRespuesta: calcularSLAPrimeraRespuesta(
          caso.createdAt,
          caso.prioridad
        ),
        slaResolucion: calcularSLAResolucion(caso.createdAt, caso.prioridad),
      },
    });
  }

  agentes.sort((a, b) => a.casos.length - b.casos.length);
  const agente = agentes[0];

  return prisma.caso.update({
    where: { id: casoId },
    data: {
      agenteId: agente.id,
      estado: "asignado",
      slaPrimeraRespuesta: calcularSLAPrimeraRespuesta(
        caso.createdAt,
        caso.prioridad
      ),
      slaResolucion: calcularSLAResolucion(caso.createdAt, caso.prioridad),
    },
  });
}

export function generarNumeroCaso(prefix: string = "CASO"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
