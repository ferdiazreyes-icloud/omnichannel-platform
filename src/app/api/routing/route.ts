import { NextRequest, NextResponse } from "next/server";
import { asignarCaso } from "@/lib/routing";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { casoId } = body;

  if (!casoId) {
    return NextResponse.json(
      { error: "Se requiere casoId" },
      { status: 400 }
    );
  }

  const caso = await asignarCaso(casoId);
  if (!caso) {
    return NextResponse.json(
      { error: "No hay agentes disponibles" },
      { status: 503 }
    );
  }

  return NextResponse.json(caso);
}
