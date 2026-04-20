import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    caso: {
      create: vi.fn(),
    },
    interaccion: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/ai", () => ({
  resumirConversacion: vi.fn(),
}));

vi.mock("@/lib/perfiles", () => ({
  obtenerPerfilActivo: vi.fn(),
  obtenerPerfilActivoId: vi.fn(),
}));

vi.mock("@/lib/vapi", () => ({
  dispararLlamadaOutbound: vi.fn(),
  perfilSoportaLlamada: vi.fn((id: string) => id === "telco-ejemplo"),
}));

vi.mock("@/lib/sla", () => ({
  calcularSLAPrimeraRespuesta: vi.fn(() => new Date()),
  calcularSLAResolucion: vi.fn(() => new Date()),
}));

vi.mock("@/lib/routing", () => ({
  generarNumeroCaso: vi.fn(() => "TEST-CASE-123"),
}));

import { POST } from "../route";
import { prisma } from "@/lib/db";
import { resumirConversacion } from "@/lib/ai";
import {
  obtenerPerfilActivo,
  obtenerPerfilActivoId,
} from "@/lib/perfiles";
import { dispararLlamadaOutbound } from "@/lib/vapi";

const buildRequest = (body: unknown) =>
  ({
    json: async () => body,
  } as unknown as Request);

const telcoProfile = {
  nombreCorto: "Conecta",
  nombre: "Conecta Telecom",
  industria: "Telecomunicaciones",
};

describe("POST /api/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerPerfilActivo).mockReturnValue(
      telcoProfile as ReturnType<typeof obtenerPerfilActivo>
    );
    vi.mocked(obtenerPerfilActivoId).mockReturnValue("telco-ejemplo");
    vi.mocked(resumirConversacion).mockResolvedValue(
      "Cliente quiere upgrade a Fibra 300."
    );
    vi.mocked(prisma.caso.create).mockResolvedValue({
      id: "case-uuid",
      numeroCaso: "TEST-CASE-123",
    } as never);
    vi.mocked(prisma.interaccion.create).mockResolvedValue({} as never);
  });

  it("rejects when active profile is not telco-ejemplo", async () => {
    vi.mocked(obtenerPerfilActivoId).mockReturnValue("megacable");

    const res = await POST(
      buildRequest({
        mensajes: [],
        datosCapturados: { telefono: "5512345678" },
      }) as never
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("profile_not_supported");
    expect(prisma.caso.create).not.toHaveBeenCalled();
    expect(dispararLlamadaOutbound).not.toHaveBeenCalled();
  });

  it("rejects when phone is missing or invalid", async () => {
    const res = await POST(
      buildRequest({
        mensajes: [],
        datosCapturados: { telefono: "123" },
      }) as never
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("missing_phone");
    expect(prisma.caso.create).not.toHaveBeenCalled();
  });

  it("rejects when name is missing (needed for personalized greeting)", async () => {
    const res = await POST(
      buildRequest({
        mensajes: [],
        datosCapturados: { telefono: "5512345678" },
      }) as never
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("missing_name");
    expect(prisma.caso.create).not.toHaveBeenCalled();
    expect(dispararLlamadaOutbound).not.toHaveBeenCalled();
  });

  it("creates case, logs two system interactions, and triggers Vapi on happy path", async () => {
    vi.mocked(dispararLlamadaOutbound).mockResolvedValue({
      success: true,
      payload: {} as never,
    });

    const res = await POST(
      buildRequest({
        mensajes: [{ role: "user", content: "quiero Fibra 300" }],
        datosCapturados: {
          nombre: "Juan Pérez",
          telefono: "+52 (55) 1234-5678",
        },
        intencion: "venta",
        categoria: "Contratación de fibra óptica",
        prioridad: "media",
      }) as never
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.casoId).toBe("case-uuid");
    expect(body.numeroCaso).toBe("TEST-CASE-123");
    expect(body.telefono).toBe("5512345678");

    expect(prisma.caso.create).toHaveBeenCalledTimes(1);
    const casoPayload = vi.mocked(prisma.caso.create).mock.calls[0][0].data;
    expect(casoPayload.canalOrigen).toBe("voz");
    expect(casoPayload.clienteContacto).toBe("5512345678");
    expect(casoPayload.estado).toBe("nuevo");

    expect(prisma.interaccion.create).toHaveBeenCalledTimes(2);
    expect(dispararLlamadaOutbound).toHaveBeenCalledWith({
      perfilId: "telco-ejemplo",
      nombre: "Juan Pérez",
      telefono: "5512345678",
      resumen: "Cliente quiere upgrade a Fibra 300.",
    });
  });

  it("still creates case but returns 502 when Vapi fails", async () => {
    vi.mocked(dispararLlamadaOutbound).mockResolvedValue({
      success: false,
      error: "upstream_500",
      payload: {} as never,
    });

    const res = await POST(
      buildRequest({
        mensajes: [],
        datosCapturados: {
          nombre: "Juan",
          telefono: "5512345678",
        },
      }) as never
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.casoId).toBe("case-uuid");
    expect(body.error).toBe("upstream_500");
    expect(prisma.caso.create).toHaveBeenCalledTimes(1);
    expect(prisma.interaccion.create).toHaveBeenCalledTimes(2);
  });
});
