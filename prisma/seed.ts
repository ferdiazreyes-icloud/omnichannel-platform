import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

const CANALES = ["whatsapp", "sms", "web", "facebook", "instagram", "voz"];
const INTENCIONES = ["venta", "soporte", "cobranza", "informacion"];
const PRIORIDADES = ["alta", "media", "baja"];
const ESTADOS = [
  "nuevo",
  "asignado",
  "en_curso",
  "escalado",
  "resuelto",
  "cerrado",
];

const CATEGORIAS: Record<string, string[]> = {
  venta: [
    "Cotización de producto",
    "Demo de plataforma",
    "Upgrade de plan",
    "Renovación de contrato",
    "Consulta de precios",
    "Solicitud de propuesta",
  ],
  soporte: [
    "Error en plataforma",
    "Problema de acceso",
    "Integración fallida",
    "Reporte no genera",
    "Lentitud del sistema",
    "Configuración de cuenta",
  ],
  cobranza: [
    "Consulta de factura",
    "Pago no reflejado",
    "Solicitud de estado de cuenta",
    "Disputa de cargo",
    "Plan de pagos",
    "Facturación errónea",
  ],
  informacion: [
    "Información general",
    "Horarios de atención",
    "Sucursales",
    "Requisitos de servicio",
    "Política de privacidad",
    "Términos y condiciones",
  ],
};

const NOMBRES = [
  "Juan Pérez",
  "María González",
  "Carlos Rodríguez",
  "Ana Martínez",
  "Luis Hernández",
  "Patricia López",
  "Miguel Torres",
  "Elena Díaz",
  "Fernando Sánchez",
  "Claudia Rivera",
  "José García",
  "Lucía Morales",
  "Antonio Cruz",
  "Rosa Vargas",
  "Manuel Flores",
  "Carmen Ortiz",
  "Francisco Reyes",
  "Isabel Mendoza",
  "Ricardo Castro",
  "Diana Romero",
  "Alberto Ruiz",
  "Verónica Jiménez",
  "Eduardo Medina",
  "Gabriela Herrera",
  "Sergio Guzmán",
  "Natalia Aguilar",
  "Raúl Peña",
  "Andrea Ramírez",
  "Héctor Navarro",
  "Daniela Vega",
];

const MENSAJES_CLIENTE: Record<string, string[]> = {
  venta: [
    "Hola, me interesa conocer sus planes de servicio",
    "Quiero cotizar la plataforma omnicanal para mi empresa",
    "¿Cuál es el costo de la licencia empresarial?",
    "Necesito un demo de la plataforma",
    "Quiero renovar nuestro contrato con mejores condiciones",
  ],
  soporte: [
    "Tengo un error al generar reportes",
    "No puedo acceder a mi cuenta desde ayer",
    "La integración con nuestro CRM dejó de funcionar",
    "El sistema está muy lento hoy",
    "Necesito ayuda para configurar los dashboards",
  ],
  cobranza: [
    "Hice un pago hace 3 días y no se refleja",
    "Quiero consultar mi estado de cuenta",
    "Hay un cargo que no reconozco en mi factura",
    "Necesito un plan de pagos para mi saldo pendiente",
    "La factura del mes pasado tiene un error",
  ],
  informacion: [
    "¿Cuáles son sus horarios de atención?",
    "¿Tienen sucursal en Guadalajara?",
    "¿Qué requisitos necesito para contratar?",
    "Quiero saber más sobre sus servicios",
    "¿Cómo funciona la plataforma omnicanal?",
  ],
};

const RESPUESTAS_BOT: Record<string, string[]> = {
  venta: [
    "¡Hola! Con gusto te ayudo con información de nuestros planes. ¿Para cuántos agentes necesitarías la plataforma?",
    "Entiendo, voy a crear un caso para que un ejecutivo comercial te contacte con una propuesta personalizada.",
  ],
  soporte: [
    "Lamento el inconveniente. Voy a escalar tu caso al equipo de soporte técnico para que lo revisen lo antes posible.",
    "Entiendo la urgencia. Estoy creando un ticket prioritario para que el equipo lo atienda.",
  ],
  cobranza: [
    "Claro, voy a revisar tu cuenta. ¿Me podrías confirmar tu nombre y número de cliente?",
    "Ya tengo la información. Creo un caso para que el equipo de cobranza lo revise.",
  ],
  informacion: [
    "¡Con gusto! Nuestro horario de atención es de lunes a viernes de 8:00 a 20:00.",
    "Te comparto la información y creo un caso por si necesitas seguimiento.",
  ],
};

const RESPUESTAS_AGENTE: string[] = [
  "Hola, ya revisé tu caso. Estamos trabajando en la solución.",
  "Gracias por tu paciencia. Te confirmo que ya se está procesando tu solicitud.",
  "He escalado el tema internamente para una resolución más rápida.",
  "Tu caso ya fue resuelto. ¿Necesitas algo más?",
  "Te informo que el ajuste ya fue aplicado a tu cuenta.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarNumeroCaso(index: number): string {
  const ts = (Date.now() - index * 100000).toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ARENA-${ts}-${rand}`;
}

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.interaccion.deleteMany();
  await prisma.caso.deleteMany();
  await prisma.agente.deleteMany();

  console.log("Creando agentes...");
  const agentesData = [
    { nombre: "María García", email: "maria.garcia@arena.com", equipo: "ventas" },
    { nombre: "Carlos López", email: "carlos.lopez@arena.com", equipo: "ventas" },
    { nombre: "Ana Martínez", email: "ana.martinez@arena.com", equipo: "soporte" },
    { nombre: "Roberto Díaz", email: "roberto.diaz@arena.com", equipo: "soporte" },
    { nombre: "Laura Hernández", email: "laura.hernandez@arena.com", equipo: "soporte" },
    { nombre: "Pedro Sánchez", email: "pedro.sanchez@arena.com", equipo: "cobranza" },
    { nombre: "Sofía Rivera", email: "sofia.rivera@arena.com", equipo: "cobranza" },
    { nombre: "Diego Torres", email: "diego.torres@arena.com", equipo: "general" },
    { nombre: "Valentina Cruz", email: "valentina.cruz@arena.com", equipo: "general" },
    { nombre: "Andrés Morales", email: "andres.morales@arena.com", equipo: "ventas" },
  ];

  const agentes = [];
  for (const a of agentesData) {
    const agente = await prisma.agente.create({
      data: { id: uuid(), ...a },
    });
    agentes.push(agente);
  }
  console.log(`${agentes.length} agentes creados.`);

  const SEED_COUNT = parseInt(process.env.DEMO_SEED_COUNT || "300", 10);
  console.log(`Creando ${SEED_COUNT} casos...`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < SEED_COUNT; i++) {
    const createdAt = new Date(
      thirtyDaysAgo.getTime() +
        Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
    );

    const intencion = pick(INTENCIONES);
    const canal = pick(CANALES);
    const prioridad = pick(PRIORIDADES);
    const categoria = pick(CATEGORIAS[intencion]);
    const nombre = pick(NOMBRES);
    const contacto =
      Math.random() > 0.5
        ? `${nombre.toLowerCase().replace(/ /g, ".")}@email.com`
        : `+52 ${randomInt(55, 99)}${randomInt(1000, 9999)}${randomInt(1000, 9999)}`;

    // Determine state based on age - older cases more likely resolved
    const ageHours =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    let estado: string;
    const rand = Math.random();

    if (ageHours > 48) {
      // Older cases: mostly resolved/closed
      if (rand < 0.4) estado = "cerrado";
      else if (rand < 0.75) estado = "resuelto";
      else if (rand < 0.85) estado = "escalado";
      else if (rand < 0.92) estado = "en_curso";
      else estado = "asignado";
    } else if (ageHours > 12) {
      // Mid-age: mixed
      if (rand < 0.15) estado = "cerrado";
      else if (rand < 0.3) estado = "resuelto";
      else if (rand < 0.45) estado = "en_curso";
      else if (rand < 0.6) estado = "escalado";
      else if (rand < 0.8) estado = "asignado";
      else estado = "nuevo";
    } else {
      // Recent: mostly new/assigned
      if (rand < 0.35) estado = "nuevo";
      else if (rand < 0.6) estado = "asignado";
      else if (rand < 0.8) estado = "en_curso";
      else estado = "escalado";
    }

    const slaMultiplier =
      prioridad === "alta" ? 0.5 : prioridad === "baja" ? 2 : 1;
    const slaPrimeraRespuesta = new Date(
      createdAt.getTime() + 15 * slaMultiplier * 60 * 1000
    );
    const slaResolucion = new Date(
      createdAt.getTime() + 24 * slaMultiplier * 60 * 60 * 1000
    );

    // Calculate response and resolution times
    let primeraRespuestaAt: Date | null = null;
    let resolvedAt: Date | null = null;
    let csat: number | null = null;

    if (estado !== "nuevo") {
      // First response: usually within SLA, sometimes not
      const responseMinutes =
        Math.random() < 0.8
          ? randomInt(1, Math.floor(15 * slaMultiplier))
          : randomInt(
              Math.floor(15 * slaMultiplier),
              Math.floor(30 * slaMultiplier)
            );
      primeraRespuestaAt = new Date(
        createdAt.getTime() + responseMinutes * 60 * 1000
      );
    }

    if (estado === "resuelto" || estado === "cerrado") {
      const resolutionHours =
        Math.random() < 0.75
          ? randomInt(1, Math.floor(24 * slaMultiplier))
          : randomInt(
              Math.floor(24 * slaMultiplier),
              Math.floor(48 * slaMultiplier)
            );
      resolvedAt = new Date(
        createdAt.getTime() + resolutionHours * 60 * 60 * 1000
      );
      csat = Math.random() < 0.7 ? randomInt(4, 5) : randomInt(1, 3);
    }

    // Assign agent (except for "nuevo")
    const agenteId =
      estado === "nuevo" ? null : pick(agentes).id;

    const caso = await prisma.caso.create({
      data: {
        id: uuid(),
        numeroCaso: generarNumeroCaso(i),
        canalOrigen: canal,
        clienteNombre: nombre,
        clienteContacto: contacto,
        intencion,
        categoria,
        prioridad,
        estado,
        resumen: `${categoria} - ${nombre}`,
        slaPrimeraRespuesta: slaPrimeraRespuesta,
        slaResolucion: slaResolucion,
        primeraRespuestaAt,
        resolvedAt,
        csat,
        agenteId,
        createdAt,
        updatedAt: resolvedAt || new Date(),
      },
    });

    // Create interactions
    const interacciones = [];

    // Client message
    interacciones.push({
      id: uuid(),
      tipo: "cliente",
      contenido: pick(MENSAJES_CLIENTE[intencion]),
      canal,
      casoId: caso.id,
      createdAt: createdAt,
    });

    // Bot response
    interacciones.push({
      id: uuid(),
      tipo: "bot",
      contenido: RESPUESTAS_BOT[intencion][0],
      canal,
      casoId: caso.id,
      createdAt: new Date(createdAt.getTime() + 5000),
    });

    // System assignment
    if (estado !== "nuevo") {
      interacciones.push({
        id: uuid(),
        tipo: "sistema",
        contenido: `Caso asignado automáticamente. Prioridad: ${prioridad}. SLA primera respuesta: ${slaPrimeraRespuesta.toLocaleString()}.`,
        canal: "sistema",
        casoId: caso.id,
        createdAt: new Date(createdAt.getTime() + 10000),
      });

      // Agent response
      if (primeraRespuestaAt) {
        interacciones.push({
          id: uuid(),
          tipo: "agente",
          contenido: pick(RESPUESTAS_AGENTE),
          canal,
          casoId: caso.id,
          createdAt: primeraRespuestaAt,
        });
      }

      // More interactions for resolved cases
      if (estado === "resuelto" || estado === "cerrado") {
        interacciones.push({
          id: uuid(),
          tipo: "cliente",
          contenido: "Gracias por la ayuda.",
          canal,
          casoId: caso.id,
          createdAt: new Date(
            (primeraRespuestaAt?.getTime() || createdAt.getTime()) + 600000
          ),
        });

        interacciones.push({
          id: uuid(),
          tipo: "agente",
          contenido:
            "Con gusto. El caso queda resuelto. No dudes en contactarnos si necesitas algo más.",
          canal,
          casoId: caso.id,
          createdAt: resolvedAt || new Date(),
        });

        if (estado === "cerrado") {
          interacciones.push({
            id: uuid(),
            tipo: "sistema",
            contenido: `Caso cerrado. CSAT: ${csat}/5.`,
            canal: "sistema",
            casoId: caso.id,
            createdAt: new Date(
              (resolvedAt?.getTime() || createdAt.getTime()) + 3600000
            ),
          });
        }
      }
    }

    await prisma.interaccion.createMany({ data: interacciones });

    if ((i + 1) % 50 === 0) {
      console.log(`  ${i + 1}/${SEED_COUNT} casos creados...`);
    }
  }

  console.log(`\nSeed completado: ${SEED_COUNT} casos con interacciones.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
