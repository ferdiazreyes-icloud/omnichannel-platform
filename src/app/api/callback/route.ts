import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resumirConversacion } from "@/lib/ai";
import { generarNumeroCaso } from "@/lib/routing";
import {
  calcularSLAPrimeraRespuesta,
  calcularSLAResolucion,
} from "@/lib/sla";
import {
  obtenerPerfilActivo,
  obtenerPerfilActivoId,
} from "@/lib/perfiles";
import {
  dispararLlamadaOutbound,
  perfilSoportaLlamada,
} from "@/lib/vapi";

interface CallbackRequest {
  mensajes: Array<{ role: "user" | "assistant"; content: string }>;
  datosCapturados: {
    nombre?: string;
    contacto?: string;
    telefono?: string;
    asunto?: string;
  };
  intencion?: string;
  categoria?: string;
  prioridad?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CallbackRequest;
  const { mensajes, datosCapturados, intencion, categoria, prioridad } = body;

  const perfilId = obtenerPerfilActivoId();
  const perfil = obtenerPerfilActivo();

  if (!perfilSoportaLlamada(perfilId)) {
    return NextResponse.json(
      {
        success: false,
        error: "profile_not_supported",
        mensaje: `${perfil.nombreCorto} no tiene llamadas de voz habilitadas en esta demo.`,
      },
      { status: 400 }
    );
  }

  const telefono = datosCapturados.telefono?.replace(/\D/g, "").slice(-10);
  if (!telefono || telefono.length !== 10) {
    return NextResponse.json(
      {
        success: false,
        error: "missing_phone",
        mensaje: "Necesitamos un teléfono de 10 dígitos para llamarte.",
      },
      { status: 400 }
    );
  }

  const nombre = datosCapturados.nombre?.trim();
  if (!nombre) {
    return NextResponse.json(
      {
        success: false,
        error: "missing_name",
        mensaje: "Necesitamos tu nombre para que el agente te salude personalmente.",
      },
      { status: 400 }
    );
  }
  const resumen = await resumirConversacion(mensajes, datosCapturados);

  const now = new Date();
  const prioridadFinal = prioridad || "media";
  const caso = await prisma.caso.create({
    data: {
      numeroCaso: generarNumeroCaso(perfil.nombreCorto.toUpperCase().slice(0, 4)),
      canalOrigen: "voz",
      clienteNombre: nombre,
      clienteContacto: telefono,
      intencion: intencion || "informacion",
      categoria: categoria || "Callback solicitado",
      prioridad: prioridadFinal,
      estado: "nuevo",
      resumen,
      slaPrimeraRespuesta: calcularSLAPrimeraRespuesta(now, prioridadFinal),
      slaResolucion: calcularSLAResolucion(now, prioridadFinal),
    },
  });

  await prisma.interaccion.create({
    data: {
      tipo: "sistema",
      contenido: `Callback outbound solicitado desde chat. Resumen generado:\n\n${resumen}`,
      canal: "voz",
      casoId: caso.id,
    },
  });

  const llamada = await dispararLlamadaOutbound({
    perfilId,
    nombre,
    telefono,
    resumen,
  });

  await prisma.interaccion.create({
    data: {
      tipo: "sistema",
      contenido: llamada.success
        ? `Llamada outbound disparada al ${telefono} vía Vapi.`
        : `Fallo al disparar llamada outbound (${llamada.error}). Un agente hará seguimiento.`,
      canal: "voz",
      casoId: caso.id,
    },
  });

  return NextResponse.json(
    {
      success: llamada.success,
      casoId: caso.id,
      numeroCaso: caso.numeroCaso,
      telefono,
      error: llamada.error,
      mensaje: llamada.success
        ? `Te estamos llamando al ${telefono}. Tu caso es ${caso.numeroCaso}.`
        : `Creamos el caso ${caso.numeroCaso} pero no pudimos iniciar la llamada ahora. Un agente te contactará pronto.`,
    },
    { status: llamada.success ? 200 : 502 }
  );
}
