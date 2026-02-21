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

Responde en español.`;
}
