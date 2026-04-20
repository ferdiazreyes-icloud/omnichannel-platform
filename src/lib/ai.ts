import Anthropic from "@anthropic-ai/sdk";
import {
  obtenerPerfilActivo,
  generarSystemPrompt,
  type PerfilNegocio,
} from "./perfiles";

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
    telefono?: string;
    asunto?: string;
  };
  casoListo: boolean;
  solicitaLlamada: boolean;
}

export async function chatWithBot(
  mensajes: Array<{ role: "user" | "assistant"; content: string }>,
  canal: string
): Promise<BotResponse> {
  const perfil = obtenerPerfilActivo();

  // If no API key, use simulated response
  if (!process.env.ANTHROPIC_API_KEY) {
    return simulateBot(mensajes, canal, perfil);
  }

  try {
    const systemPrompt = generarSystemPrompt(perfil, canal);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
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
        // Replace undefined with null for valid JSON
        const cleaned = jsonMatch[0].replace(/\bundefined\b/g, "null");
        return JSON.parse(cleaned) as BotResponse;
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
      solicitaLlamada: false,
    };
  } catch {
    return simulateBot(mensajes, canal, perfil);
  }
}

const CALLBACK_KEYWORDS = [
  "llámame",
  "llamame",
  "llámenme",
  "llamenme",
  "márcame",
  "marcame",
  "márquenme",
  "marquenme",
  "prefiero hablar",
  "prefiero que me llamen",
  "mejor por teléfono",
  "mejor por telefono",
  "háblame",
  "hablame",
];

function detectaSolicitudLlamada(texto: string): boolean {
  const t = texto.toLowerCase();
  return CALLBACK_KEYWORDS.some((kw) => t.includes(kw));
}

function extraerTelefono(texto: string): string | undefined {
  const digits = texto.replace(/\D/g, "");
  const match = digits.match(/\d{10}/);
  return match ? match[0] : undefined;
}

function simulateBot(
  mensajes: Array<{ role: "user" | "assistant"; content: string }>,
  canal: string,
  perfil: PerfilNegocio
): BotResponse {
  const lastMsg = mensajes[mensajes.length - 1]?.content.toLowerCase() || "";
  const msgCount = mensajes.filter((m) => m.role === "user").length;

  // First message: welcome with profile branding
  if (msgCount === 1) {
    const bienvenida =
      perfil.mensajesBienvenida[canal] ||
      `¡Hola! Bienvenido a ${perfil.nombre}. ¿En qué puedo ayudarte hoy?`;
    return {
      mensaje: bienvenida,
      intencion: null,
      categoria: null,
      prioridad: null,
      datosCapturados: {},
      casoListo: false,
      solicitaLlamada: false,
    };
  }

  // Detect intent using profile categories
  let intencion: string | null = null;
  for (const intent of perfil.intenciones) {
    const cats = perfil.categorias[intent] || [];
    for (const cat of cats) {
      const words = cat.toLowerCase().split(/\s+/);
      if (words.some((w) => w.length > 3 && lastMsg.includes(w))) {
        intencion = intent;
        break;
      }
    }
    if (intencion) break;
  }

  // Fallback intent detection
  if (!intencion) {
    if (
      lastMsg.includes("comprar") ||
      lastMsg.includes("precio") ||
      lastMsg.includes("cotiz") ||
      lastMsg.includes("contratar") ||
      lastMsg.includes("plan")
    ) {
      intencion = "venta";
    } else if (
      lastMsg.includes("problema") ||
      lastMsg.includes("error") ||
      lastMsg.includes("no funciona") ||
      lastMsg.includes("falla") ||
      lastMsg.includes("no puedo")
    ) {
      intencion = "soporte";
    } else if (
      lastMsg.includes("pago") ||
      lastMsg.includes("factura") ||
      lastMsg.includes("cobr") ||
      lastMsg.includes("deuda") ||
      lastMsg.includes("saldo")
    ) {
      intencion = "cobranza";
    } else if (
      lastMsg.includes("info") ||
      lastMsg.includes("horario") ||
      lastMsg.includes("requisito") ||
      lastMsg.includes("cómo")
    ) {
      intencion = "informacion";
    }
  }

  // Pick a relevant category
  let categoria: string | null = null;
  if (intencion && perfil.categorias[intencion]) {
    const cats = perfil.categorias[intencion];
    for (const cat of cats) {
      const words = cat.toLowerCase().split(/\s+/);
      if (words.some((w) => w.length > 3 && lastMsg.includes(w))) {
        categoria = cat;
        break;
      }
    }
    if (!categoria) {
      categoria = cats[Math.floor(Math.random() * cats.length)];
    }
  }

  // Aggregate callback signals across the whole conversation so it persists
  // turn-over-turn (e.g. user first says "llámame", later provides phone).
  const userTexts = mensajes
    .filter((m) => m.role === "user")
    .map((m) => m.content);
  const pidioLlamada = userTexts.some(detectaSolicitudLlamada);
  const telefonoCapturado = userTexts
    .map(extraerTelefono)
    .find((t): t is string => Boolean(t));

  if (msgCount === 2) {
    const intentLabel = intencion
      ? `parece que necesitas ayuda con ${intencion}`
      : "cuéntame más sobre tu consulta";
    return {
      mensaje: `Entiendo, ${intentLabel}. Para poder crear un caso y que un especialista de ${perfil.nombreCorto} te atienda, necesito algunos datos. ¿Me podrías compartir tu nombre completo?`,
      intencion,
      categoria,
      prioridad: null,
      datosCapturados: telefonoCapturado ? { telefono: telefonoCapturado } : {},
      casoListo: false,
      solicitaLlamada: pidioLlamada,
    };
  }

  if (msgCount === 3) {
    const nombre = mensajes[mensajes.length - 1]?.content || "Cliente";
    const mensaje = pidioLlamada && !telefonoCapturado
      ? `Gracias, ${nombre}. Para llamarte necesito tu número de 10 dígitos. ¿Me lo compartes?`
      : `Gracias, ${nombre}. ¿Me podrías compartir un correo electrónico o número de teléfono para que el equipo de ${perfil.nombreCorto} pueda contactarte?`;
    return {
      mensaje,
      intencion: intencion || "informacion",
      categoria: categoria || "Consulta general",
      prioridad: "media",
      datosCapturados: telefonoCapturado
        ? { nombre, telefono: telefonoCapturado }
        : { nombre },
      casoListo: false,
      solicitaLlamada: pidioLlamada,
    };
  }

  // Message 4+: create case
  const nombreMatch = mensajes[4]?.content || "Cliente";
  const contacto = mensajes[mensajes.length - 1]?.content || "sin contacto";
  const telefonoFinal = telefonoCapturado || extraerTelefono(contacto);

  return {
    mensaje: pidioLlamada && telefonoFinal
      ? `Perfecto, ${nombreMatch}. Te voy a llamar al ${telefonoFinal} en un momento. ¿Confirmas?`
      : `Perfecto, ya tengo toda la información necesaria. Voy a crear un caso en ${perfil.nombreCorto} para que un especialista te atienda lo antes posible. Recibirás un número de seguimiento en un momento. ¡Gracias por contactarnos!`,
    intencion: intencion || "informacion",
    categoria: categoria || "Consulta general",
    prioridad: lastMsg.includes("urgente") || lastMsg.includes("emergencia") ? "alta" : "media",
    datosCapturados: {
      nombre: nombreMatch,
      contacto: contacto,
      telefono: telefonoFinal,
      asunto: `${categoria || "Consulta"} - ${perfil.nombreCorto}`,
    },
    casoListo: true,
    solicitaLlamada: pidioLlamada,
  };
}

export async function resumirConversacion(
  mensajes: Array<{ role: "user" | "assistant"; content: string }>,
  datosCapturados: { nombre?: string; asunto?: string }
): Promise<string> {
  const perfil = obtenerPerfilActivo();
  const historial = mensajes
    .map((m) => `${m.role === "user" ? "Cliente" : "Bot"}: ${m.content}`)
    .join("\n");

  const fallback = `Cliente ${datosCapturados.nombre || ""} contactó a ${perfil.nombreCorto}${
    datosCapturados.asunto ? ` por: ${datosCapturados.asunto}` : ""
  }. Continuar la conversación por voz.`.trim();

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallback;
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: `Eres un asistente que resume conversaciones de chat para que un agente de voz las lea antes de llamar al cliente. Responde en español, máximo 150 palabras, en tercera persona, con los hechos clave: motivo del contacto, producto/servicio mencionado, estado emocional si aplica, y qué espera el cliente. No incluyas saludos ni despedidas. Solo el resumen plano, sin formato.`,
      messages: [
        {
          role: "user",
          content: `Resume esta conversación del chat de ${perfil.nombreCorto} (${perfil.industria}):\n\n${historial}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function sugerirRespuesta(
  contexto: string,
  historial: string
): Promise<string> {
  const perfil = obtenerPerfilActivo();

  if (!process.env.ANTHROPIC_API_KEY) {
    return `Gracias por tu paciencia. En ${perfil.nombreCorto} estamos revisando tu caso y te daremos una respuesta pronto. ¿Hay algo más en lo que pueda ayudarte?`;
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: `Eres un agente de servicio al cliente de ${perfil.nombre} (${perfil.industria}). ${perfil.tono} Sugiere una respuesta profesional, empática y concisa para el siguiente caso. Responde solo con el texto de la respuesta sugerida, sin formato JSON.`,
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
    return `Gracias por tu paciencia. En ${perfil.nombreCorto} estamos revisando tu caso y te daremos una respuesta pronto. ¿Hay algo más en lo que pueda ayudarte?`;
  }
}
