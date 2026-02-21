import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface BotResponse {
  mensaje: string;
  intencion: string | null;
  categoria: string | null;
  prioridad: string | null;
  datosCapturados: {
    nombre?: string;
    contacto?: string;
    asunto?: string;
  };
  casoListo: boolean;
}

const SYSTEM_PROMPT = `Eres el asistente virtual de Arena Analytics, una empresa de soluciones de Customer Operations. Tu rol es atender clientes que contactan por cualquier canal.

Tu objetivo en cada conversación:
1. Saludar amablemente
2. Identificar la intención del cliente (venta, soporte, cobranza, informacion)
3. Capturar datos mínimos: nombre del cliente, datos de contacto, y describir su asunto
4. Determinar la prioridad (alta, media, baja) según la urgencia
5. Cuando tengas suficiente información, indicar que el caso está listo para crear

IMPORTANTE: Responde SIEMPRE en formato JSON con esta estructura:
{
  "mensaje": "Tu respuesta al cliente en texto natural",
  "intencion": "venta|soporte|cobranza|informacion" o null si aún no está claro,
  "categoria": "categoría específica del problema" o null,
  "prioridad": "alta|media|baja" o null,
  "datosCapturados": {
    "nombre": "nombre del cliente si lo mencionó" o undefined,
    "contacto": "email o teléfono si lo mencionó" o undefined,
    "asunto": "resumen del asunto" o undefined
  },
  "casoListo": true/false (true solo cuando tienes nombre, contacto, intención y asunto)
}

Sé conciso, profesional y empático. Responde en español.`;

export async function chatWithBot(
  mensajes: Array<{ role: "user" | "assistant"; content: string }>,
  canal: string
): Promise<BotResponse> {
  // If no API key, use simulated response
  if (!process.env.ANTHROPIC_API_KEY) {
    return simulateBot(mensajes, canal);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT + `\n\nEl cliente se contacta por: ${canal}`,
      messages: mensajes.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as BotResponse;
      }
    } catch {
      // If JSON parsing fails, wrap the text
    }

    return {
      mensaje: text,
      intencion: null,
      categoria: null,
      prioridad: null,
      datosCapturados: {},
      casoListo: false,
    };
  } catch {
    return simulateBot(mensajes, canal);
  }
}

function simulateBot(
  mensajes: Array<{ role: "user" | "assistant"; content: string }>,
  _canal: string
): BotResponse {
  const lastMsg = mensajes[mensajes.length - 1]?.content.toLowerCase() || "";
  const msgCount = mensajes.filter((m) => m.role === "user").length;

  if (msgCount === 1) {
    return {
      mensaje:
        "¡Hola! Bienvenido a Arena Analytics. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy? Puedo asistirte con información sobre nuestros servicios, soporte técnico, consultas de cobranza o ventas.",
      intencion: null,
      categoria: null,
      prioridad: null,
      datosCapturados: {},
      casoListo: false,
    };
  }

  // Detect intent
  let intencion: string | null = null;
  if (
    lastMsg.includes("comprar") ||
    lastMsg.includes("precio") ||
    lastMsg.includes("cotiz") ||
    lastMsg.includes("venta")
  ) {
    intencion = "venta";
  } else if (
    lastMsg.includes("problema") ||
    lastMsg.includes("error") ||
    lastMsg.includes("ayuda") ||
    lastMsg.includes("soporte") ||
    lastMsg.includes("funciona")
  ) {
    intencion = "soporte";
  } else if (
    lastMsg.includes("pago") ||
    lastMsg.includes("factura") ||
    lastMsg.includes("cobr") ||
    lastMsg.includes("deuda")
  ) {
    intencion = "cobranza";
  } else if (
    lastMsg.includes("info") ||
    lastMsg.includes("saber") ||
    lastMsg.includes("qué es") ||
    lastMsg.includes("cómo")
  ) {
    intencion = "informacion";
  }

  if (msgCount === 2) {
    return {
      mensaje: `Entiendo, ${intencion ? "parece que necesitas ayuda con " + intencion : "cuéntame más sobre tu consulta"}. Para poder crear un caso y que un agente especializado te atienda, necesito algunos datos. ¿Me podrías compartir tu nombre completo?`,
      intencion,
      categoria: intencion,
      prioridad: null,
      datosCapturados: {},
      casoListo: false,
    };
  }

  if (msgCount === 3) {
    const nombre = mensajes[mensajes.length - 1]?.content || "Cliente";
    return {
      mensaje: `Gracias, ${nombre}. ¿Me podrías compartir un correo electrónico o número de teléfono para que el agente pueda contactarte?`,
      intencion: intencion || "informacion",
      categoria: intencion || "consulta general",
      prioridad: "media",
      datosCapturados: { nombre },
      casoListo: false,
    };
  }

  // Message 4+: create case
  const allText = mensajes.map((m) => m.content).join(" ");
  const nombreMatch = mensajes[4]?.content || "Cliente";
  const contacto = mensajes[mensajes.length - 1]?.content || "sin contacto";

  return {
    mensaje: `Perfecto, ya tengo toda la información necesaria. Voy a crear un caso para que un agente especializado te atienda lo antes posible. Recibirás un número de seguimiento en un momento. ¡Gracias por contactarnos!`,
    intencion: intencion || "informacion",
    categoria: intencion || "consulta general",
    prioridad: allText.includes("urgente") ? "alta" : "media",
    datosCapturados: {
      nombre: nombreMatch,
      contacto: contacto,
      asunto: `Consulta de ${intencion || "información general"}`,
    },
    casoListo: true,
  };
}

export async function sugerirRespuesta(
  contexto: string,
  historial: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "Gracias por tu paciencia. Estamos revisando tu caso y te daremos una respuesta pronto. ¿Hay algo más en lo que pueda ayudarte?";
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system:
        "Eres un agente de servicio al cliente de Arena Analytics. Sugiere una respuesta profesional, empática y concisa para el siguiente caso. Responde solo con el texto de la respuesta sugerida, sin formato JSON.",
      messages: [
        {
          role: "user",
          content: `Contexto del caso: ${contexto}\n\nHistorial de conversación:\n${historial}\n\nSugiere una respuesta apropiada:`,
        },
      ],
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "No se pudo generar sugerencia.";
  } catch {
    return "Gracias por tu paciencia. Estamos revisando tu caso y te daremos una respuesta pronto. ¿Hay algo más en lo que pueda ayudarte?";
  }
}
