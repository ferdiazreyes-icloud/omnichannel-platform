import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  const { casoId } = await params;
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    include: {
      agente: true,
      interacciones: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!caso) {
    return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
  }

  return NextResponse.json(caso);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  const { casoId } = await params;
  const body = await request.json();
  const { estado, agenteId, prioridad, nota, respuesta, csat } = body;

  const updateData: Record<string, unknown> = {};
  if (estado) {
    updateData.estado = estado;
    if (estado === "resuelto" || estado === "cerrado") {
      updateData.resolvedAt = new Date();
    }
  }
  if (agenteId !== undefined) updateData.agenteId = agenteId;
  if (prioridad) updateData.prioridad = prioridad;
  if (csat) updateData.csat = csat;

  const caso = await prisma.caso.update({
    where: { id: casoId },
    data: updateData,
    include: { agente: true },
  });

  // Add internal note
  if (nota) {
    await prisma.interaccion.create({
      data: {
        tipo: "sistema",
        contenido: `[Nota interna] ${nota}`,
        canal: "sistema",
        casoId,
      },
    });
  }

  // Add agent response
  if (respuesta) {
    await prisma.interaccion.create({
      data: {
        tipo: "agente",
        contenido: respuesta,
        canal: caso.canalOrigen,
        casoId,
      },
    });

    // Mark first response if not set
    if (!caso.primeraRespuestaAt) {
      await prisma.caso.update({
        where: { id: casoId },
        data: { primeraRespuestaAt: new Date() },
      });
    }
  }

  return NextResponse.json(caso);
}
