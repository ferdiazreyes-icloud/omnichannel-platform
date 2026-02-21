import { NextRequest, NextResponse } from "next/server";
import { chatWithBot } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mensajes, canal } = body;

  if (!mensajes || !Array.isArray(mensajes)) {
    return NextResponse.json(
      { error: "Se requiere un array de mensajes" },
      { status: 400 }
    );
  }

  const response = await chatWithBot(mensajes, canal || "web");
  return NextResponse.json(response);
}
