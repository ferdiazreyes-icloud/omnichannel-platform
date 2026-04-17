import { NextRequest, NextResponse } from "next/server";
import {
  obtenerPerfilActivo,
  obtenerPerfilActivoId,
  cambiarPerfil,
  listarPerfiles,
} from "@/lib/perfiles";

export async function GET() {
  return NextResponse.json({
    activo: obtenerPerfilActivoId(),
    perfil: obtenerPerfilActivo(),
    disponibles: listarPerfiles(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { perfilId } = body;

  if (!perfilId) {
    return NextResponse.json(
      { error: "Se requiere perfilId" },
      { status: 400 }
    );
  }

  const perfil = cambiarPerfil(perfilId);

  if (!perfil) {
    return NextResponse.json(
      { error: "Perfil no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    activo: perfilId,
    perfil,
    disponibles: listarPerfiles(),
  });
}
