import { NextResponse } from "next/server";
import { obtenerPerfilActivo } from "@/lib/perfiles";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  const perfil = obtenerPerfilActivo();
  const conocimiento = perfil.conocimiento;

  // Voice-optimized system prompt — short, conversational, no JSON
  const instructions = `Eres el asistente virtual de ${perfil.nombre}, empresa de ${perfil.industria.toLowerCase()}. ${perfil.descripcion}

TONO: ${perfil.tono}

PRODUCTOS Y SERVICIOS:
${conocimiento.productos.map((p) => `- ${p}`).join("\n")}

POLÍTICAS:
${conocimiento.politicas.map((p) => `- ${p}`).join("\n")}

HORARIOS: ${conocimiento.horarios}
CONTACTO: ${conocimiento.contacto}

CATEGORÍAS: ${Object.entries(perfil.categorias)
    .map(([intent, cats]) => `${intent}: ${cats.join(", ")}`)
    .join(". ")}

REGLAS PARA VOZ:
- Responde SIEMPRE en español.
- Sé muy conciso: 1-2 oraciones máximo por respuesta.
- Habla de forma natural y conversacional, como una llamada telefónica real.
- Saluda diciendo: "${perfil.mensajesBienvenida.voz || `Gracias por llamar a ${perfil.nombreCorto}. ¿En qué te puedo ayudar?`}"
- Identifica la intención del cliente (${perfil.intenciones.join(", ")}).
- Usa tu conocimiento de productos y políticas para dar respuestas específicas.
- Si necesitas crear un caso, pide: nombre, datos de contacto, y descripción del problema.
- NO uses formato JSON, listas, ni markdown. Solo texto natural hablado.
- Si no sabes algo, ofrece transferir a un agente humano.`;

  // If no API key, return simulation mode flag
  if (!apiKey) {
    return NextResponse.json({
      simulation: true,
      perfil: {
        nombre: perfil.nombre,
        nombreCorto: perfil.nombreCorto,
        bienvenida: perfil.mensajesBienvenida.voz || `Gracias por llamar a ${perfil.nombreCorto}. ¿En qué te puedo ayudar?`,
      },
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview",
          voice: "coral",
          instructions,
          input_audio_transcription: {
            model: "whisper-1",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI session error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to create realtime session", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Voice session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
