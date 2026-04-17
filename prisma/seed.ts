import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface SeedProfile {
  id: string;
  nombre: string;
  nombreCorto: string;
  canalesHabilitados: string[];
  intenciones: string[];
  categorias: Record<string, string[]>;
  agentes: Array<{ nombre: string; email: string; equipo: string }>;
  sla: {
    primeraRespuestaMinutos: number;
    resolucionHoras: number;
    prioridadMultiplicador: Record<string, number>;
  };
  mensajesCliente: Record<string, string[]>;
}

// Load a profile for seeding
function loadProfile(profileId: string): SeedProfile {
  const profilePath = join(
    __dirname,
    "..",
    "src",
    "data",
    "perfiles",
    `${profileId}.json`
  );
  try {
    return JSON.parse(readFileSync(profilePath, "utf-8"));
  } catch {
    const fallbackPath = join(
      __dirname,
      "..",
      "src",
      "data",
      "perfiles",
      "banco-ejemplo.json"
    );
    return JSON.parse(readFileSync(fallbackPath, "utf-8"));
  }
}

const NOMBRES = [
  "Juan Pérez", "María González", "Carlos Rodríguez", "Ana Martínez",
  "Luis Hernández", "Patricia López", "Miguel Torres", "Elena Díaz",
  "Fernando Sánchez", "Claudia Rivera", "José García", "Lucía Morales",
  "Antonio Cruz", "Rosa Vargas", "Manuel Flores", "Carmen Ortiz",
  "Francisco Reyes", "Isabel Mendoza", "Ricardo Castro", "Diana Romero",
  "Alberto Ruiz", "Verónica Jiménez", "Eduardo Medina", "Gabriela Herrera",
  "Sergio Guzmán", "Natalia Aguilar", "Raúl Peña", "Andrea Ramírez",
  "Héctor Navarro", "Daniela Vega",
];

const RESPUESTAS_AGENTE: string[] = [
  "Hola, ya revisé tu caso. Estamos trabajando en la solución.",
  "Gracias por tu paciencia. Te confirmo que ya se está procesando tu solicitud.",
  "He escalado el tema internamente para una resolución más rápida.",
  "Tu caso ya fue resuelto. ¿Necesitas algo más?",
  "Te informo que el ajuste ya fue aplicado.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarNumeroCaso(index: number, prefix: string): string {
  const ts = (Date.now() - index * 100000).toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

async function main() {
  const profileId = process.env.SEED_PROFILE || "banco-ejemplo";
  const perfil = loadProfile(profileId);

  console.log(`Seeding con perfil: ${perfil.nombre} (${perfil.id})`);

  const prefix = perfil.nombreCorto.toUpperCase().slice(0, 4);

  console.log("Limpiando base de datos...");
  await prisma.interaccion.deleteMany();
  await prisma.caso.deleteMany();
  await prisma.agente.deleteMany();

  console.log("Creando agentes...");
  const agentes = [];
  for (const a of perfil.agentes) {
    const agente = await prisma.agente.create({
      data: { id: uuid(), nombre: a.nombre, email: a.email, equipo: a.equipo },
    });
    agentes.push(agente);
  }
  console.log(`${agentes.length} agentes creados.`);

  const SEED_COUNT = parseInt(process.env.DEMO_SEED_COUNT || "300", 10);
  console.log(`Creando ${SEED_COUNT} casos...`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const canales = perfil.canalesHabilitados;
  const intenciones = perfil.intenciones;
  const categorias = perfil.categorias;
  const prioridades = ["alta", "media", "baja"];
  const mensajesCliente = perfil.mensajesCliente;

  // Generate bot responses from profile
  const respuestasBot: Record<string, string[]> = {};
  for (const intent of intenciones) {
    respuestasBot[intent] = [
      `Entiendo tu consulta sobre ${intent}. Voy a crear un caso para que un especialista de ${perfil.nombreCorto} te atienda.`,
      `Gracias por contactar a ${perfil.nombreCorto}. Estoy procesando tu solicitud de ${intent}.`,
    ];
  }

  for (let i = 0; i < SEED_COUNT; i++) {
    const createdAt = new Date(
      thirtyDaysAgo.getTime() +
        Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
    );

    const intencion = pick(intenciones);
    const canal = pick(canales);
    const prioridad = pick(prioridades);
    const categoria = pick(categorias[intencion] || ["Consulta general"]);
    const nombre = pick(NOMBRES);
    const contacto =
      Math.random() > 0.5
        ? `${nombre.toLowerCase().replace(/ /g, ".")}@email.com`
        : `+52 ${randomInt(55, 99)}${randomInt(1000, 9999)}${randomInt(1000, 9999)}`;

    const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    let estado: string;
    const rand = Math.random();

    if (ageHours > 48) {
      if (rand < 0.4) estado = "cerrado";
      else if (rand < 0.75) estado = "resuelto";
      else if (rand < 0.85) estado = "escalado";
      else if (rand < 0.92) estado = "en_curso";
      else estado = "asignado";
    } else if (ageHours > 12) {
      if (rand < 0.15) estado = "cerrado";
      else if (rand < 0.3) estado = "resuelto";
      else if (rand < 0.45) estado = "en_curso";
      else if (rand < 0.6) estado = "escalado";
      else if (rand < 0.8) estado = "asignado";
      else estado = "nuevo";
    } else {
      if (rand < 0.35) estado = "nuevo";
      else if (rand < 0.6) estado = "asignado";
      else if (rand < 0.8) estado = "en_curso";
      else estado = "escalado";
    }

    const slaConfig = perfil.sla;
    const slaMultiplier = slaConfig.prioridadMultiplicador[prioridad] ?? 1;
    const slaPrimeraRespuesta = new Date(
      createdAt.getTime() + slaConfig.primeraRespuestaMinutos * slaMultiplier * 60 * 1000
    );
    const slaResolucion = new Date(
      createdAt.getTime() + slaConfig.resolucionHoras * slaMultiplier * 60 * 60 * 1000
    );

    let primeraRespuestaAt: Date | null = null;
    let resolvedAt: Date | null = null;
    let csat: number | null = null;

    if (estado !== "nuevo") {
      const responseMinutes =
        Math.random() < 0.8
          ? randomInt(1, Math.floor(slaConfig.primeraRespuestaMinutos * slaMultiplier))
          : randomInt(
              Math.floor(slaConfig.primeraRespuestaMinutos * slaMultiplier),
              Math.floor(slaConfig.primeraRespuestaMinutos * slaMultiplier * 2)
            );
      primeraRespuestaAt = new Date(
        createdAt.getTime() + responseMinutes * 60 * 1000
      );
    }

    if (estado === "resuelto" || estado === "cerrado") {
      const resolutionHours =
        Math.random() < 0.75
          ? randomInt(1, Math.floor(slaConfig.resolucionHoras * slaMultiplier))
          : randomInt(
              Math.floor(slaConfig.resolucionHoras * slaMultiplier),
              Math.floor(slaConfig.resolucionHoras * slaMultiplier * 2)
            );
      resolvedAt = new Date(
        createdAt.getTime() + resolutionHours * 60 * 60 * 1000
      );
      csat = Math.random() < 0.7 ? randomInt(4, 5) : randomInt(1, 3);
    }

    const agenteId = estado === "nuevo" ? null : pick(agentes).id;

    const caso = await prisma.caso.create({
      data: {
        id: uuid(),
        numeroCaso: generarNumeroCaso(i, prefix),
        canalOrigen: canal,
        clienteNombre: nombre,
        clienteContacto: contacto,
        intencion,
        categoria,
        prioridad,
        estado,
        resumen: `${categoria} - ${nombre}`,
        slaPrimeraRespuesta,
        slaResolucion,
        primeraRespuestaAt,
        resolvedAt,
        csat,
        agenteId,
        createdAt,
        updatedAt: resolvedAt || new Date(),
      },
    });

    const interacciones = [];

    const clientMsgs = mensajesCliente[intencion] || [`Consulta sobre ${categoria}`];
    interacciones.push({
      id: uuid(),
      tipo: "cliente",
      contenido: pick(clientMsgs),
      canal,
      casoId: caso.id,
      createdAt: createdAt,
    });

    interacciones.push({
      id: uuid(),
      tipo: "bot",
      contenido: pick(respuestasBot[intencion] || [`Gracias por contactar a ${perfil.nombreCorto}.`]),
      canal,
      casoId: caso.id,
      createdAt: new Date(createdAt.getTime() + 5000),
    });

    if (estado !== "nuevo") {
      interacciones.push({
        id: uuid(),
        tipo: "sistema",
        contenido: `Caso asignado automáticamente. Prioridad: ${prioridad}. SLA primera respuesta: ${slaPrimeraRespuesta.toLocaleString()}.`,
        canal: "sistema",
        casoId: caso.id,
        createdAt: new Date(createdAt.getTime() + 10000),
      });

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
          contenido: "Con gusto. El caso queda resuelto. No dudes en contactarnos si necesitas algo más.",
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

  console.log(`\nSeed completado: ${SEED_COUNT} casos para ${perfil.nombre}.`);
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
