import bancoEjemplo from "@/data/perfiles/banco-ejemplo.json";
import telcoEjemplo from "@/data/perfiles/telco-ejemplo.json";
import ecommerceEjemplo from "@/data/perfiles/ecommerce-ejemplo.json";
import megacable from "@/data/perfiles/megacable.json";
import equiposMedicos from "@/data/perfiles/equipos-medicos.json";

export interface PerfilNegocio {
  id: string;
  nombre: string;
  nombreCorto: string;
  industria: string;
  descripcion: string;
  logo: string;
  colores: {
    primario: string;
    secundario: string;
    acento: string;
    fondo: string;
  };
  canalesHabilitados: string[];
  intenciones: string[];
  categorias: Record<string, string[]>;
  equipos: Array<{ nombre: string; equipo: string }>;
  agentes: Array<{ nombre: string; email: string; equipo: string }>;
  conocimiento: {
    productos: string[];
    politicas: string[];
    horarios: string;
    contacto: string;
  };
  sla: {
    primeraRespuestaMinutos: number;
    resolucionHoras: number;
    prioridadMultiplicador: Record<string, number>;
  };
  tono: string;
  mensajesBienvenida: Record<string, string>;
  mensajesCliente: Record<string, string[]>;
}

const PERFILES: Record<string, PerfilNegocio> = {
  "banco-ejemplo": bancoEjemplo as PerfilNegocio,
  "telco-ejemplo": telcoEjemplo as PerfilNegocio,
  "ecommerce-ejemplo": ecommerceEjemplo as PerfilNegocio,
  megacable: megacable as PerfilNegocio,
  "equipos-medicos": equiposMedicos as PerfilNegocio,
};

// In-memory active profile (server-side state)
let perfilActivo: string = "banco-ejemplo";

export function obtenerPerfil(id?: string): PerfilNegocio {
  return PERFILES[id || perfilActivo] || PERFILES["banco-ejemplo"];
}

export function obtenerPerfilActivo(): PerfilNegocio {
  return PERFILES[perfilActivo] || PERFILES["banco-ejemplo"];
}

export function obtenerPerfilActivoId(): string {
  return perfilActivo;
}

export function cambiarPerfil(id: string): PerfilNegocio | null {
  if (!PERFILES[id]) return null;
  perfilActivo = id;
  return PERFILES[id];
}

export function listarPerfiles(): Array<{
  id: string;
  nombre: string;
  nombreCorto: string;
  industria: string;
  logo: string;
  colores: PerfilNegocio["colores"];
}> {
  return Object.values(PERFILES).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    nombreCorto: p.nombreCorto,
    industria: p.industria,
    logo: p.logo,
    colores: p.colores,
  }));
}

export function generarSystemPrompt(perfil: PerfilNegocio, canal: string): string {
  const conocimiento = perfil.conocimiento;

  return `Eres el asistente virtual de ${perfil.nombre}, empresa de ${perfil.industria.toLowerCase()}. ${perfil.descripcion}

TONO Y ESTILO: ${perfil.tono}

PRODUCTOS Y SERVICIOS QUE OFRECES:
${conocimiento.productos.map((p) => `• ${p}`).join("\n")}

POLÍTICAS IMPORTANTES:
${conocimiento.politicas.map((p) => `• ${p}`).join("\n")}

HORARIOS: ${conocimiento.horarios}
CONTACTO: ${conocimiento.contacto}

CATEGORÍAS QUE MANEJAS:
${Object.entries(perfil.categorias)
  .map(([intent, cats]) => `${intent}: ${cats.join(", ")}`)
  .join("\n")}

El cliente se contacta por: ${canal}

Tu objetivo en cada conversación:
1. Saludar según el tono de ${perfil.nombreCorto}
2. Identificar la intención del cliente (${perfil.intenciones.join(", ")})
3. Usar tu conocimiento de productos y políticas para dar respuestas útiles y específicas
4. Capturar datos mínimos: nombre del cliente, datos de contacto, y describir su asunto
5. Determinar la prioridad (alta, media, baja) según la urgencia
6. Cuando tengas suficiente información, indicar que el caso está listo para crear

IMPORTANTE: Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "mensaje": "Tu respuesta al cliente en texto natural",
  "intencion": null,
  "categoria": null,
  "prioridad": null,
  "datosCapturados": {
    "nombre": null,
    "contacto": null,
    "asunto": null
  },
  "casoListo": false
}

Reglas del JSON:
- "intencion": usa "venta", "soporte", "cobranza" o "informacion" cuando la identifiques, o null si aún no está claro
- "categoria": la categoría específica del problema, o null
- "prioridad": "alta", "media" o "baja", o null
- "datosCapturados": llena "nombre", "contacto" y "asunto" conforme el cliente los proporcione, usa null para los que falten
- "casoListo": true SOLO cuando tengas nombre, contacto, intención y asunto. De lo contrario false
- NUNCA uses undefined, solo null para valores ausentes
- No incluyas comentarios ni texto fuera del JSON

Responde en español.`;
}
