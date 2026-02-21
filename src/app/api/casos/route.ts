import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generarNumeroCaso } from "@/lib/routing";
import {
  calcularSLAPrimeraRespuesta,
  calcularSLAResolucion,
} from "@/lib/sla";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");
  const prioridad = searchParams.get("prioridad");
  const canal = searchParams.get("canal");
  const agenteId = searchParams.get("agenteId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const where: Record<string, unknown> = {};
  if (estado) where.estado = estado;
  if (prioridad) where.prioridad = prioridad;
  if (canal) where.canalOrigen = canal;
  if (agenteId) where.agenteId = agenteId;

  const [casos, total] = await Promise.all([
    prisma.caso.findMany({
      where,
      include: {
        agente: true,
        _count: { select: { interacciones: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.caso.count({ where }),
  ]);

  return NextResponse.json({ casos, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    canalOrigen,
    clienteNombre,
    clienteContacto,
    intencion,
    categoria,
    prioridad,
    resumen,
  } = body;

  const now = new Date();
  const caso = await prisma.caso.create({
    data: {
      numeroCaso: generarNumeroCaso(),
      canalOrigen,
      clienteNombre,
      clienteContacto,
      intencion,
      categoria: categoria || intencion,
      prioridad: prioridad || "media",
      estado: "nuevo",
      resumen,
      slaPrimeraRespuesta: calcularSLAPrimeraRespuesta(now, prioridad || "media"),
      slaResolucion: calcularSLAResolucion(now, prioridad || "media"),
    },
  });

  // Create initial interaction
  if (resumen) {
    await prisma.interaccion.create({
      data: {
        tipo: "cliente",
        contenido: resumen,
        canal: canalOrigen,
        casoId: caso.id,
      },
    });
  }

  return NextResponse.json(caso, { status: 201 });
}
