import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  construirPayload,
  dispararLlamadaOutbound,
  perfilSoportaLlamada,
} from "../vapi";

describe("vapi.construirPayload", () => {
  it("builds the exact payload shape expected by Exitus", () => {
    const payload = construirPayload({
      perfilId: "telco-ejemplo",
      nombre: "Juan Pérez",
      telefono: "5512345678",
      resumen: "Cliente reporta internet lento",
    });

    expect(payload).toEqual({
      from_number: "3341700562",
      customer_phone: "5512345678",
      destination: "demo-telco-dev",
      params: {
        name: "Juan Pérez",
        note: "Cliente reporta internet lento",
      },
    });
  });

  it("normalizes phone numbers by stripping non-digits and keeping last 10", () => {
    const payload = construirPayload({
      perfilId: "telco-ejemplo",
      nombre: "X",
      telefono: "+52 (55) 1234-5678",
      resumen: "test",
    });

    expect(payload.customer_phone).toBe("5512345678");
  });
});

describe("vapi.perfilSoportaLlamada", () => {
  it("returns true only for telco-ejemplo", () => {
    expect(perfilSoportaLlamada("telco-ejemplo")).toBe(true);
    expect(perfilSoportaLlamada("megacable")).toBe(false);
    expect(perfilSoportaLlamada("jll")).toBe(false);
  });
});

describe("vapi.dispararLlamadaOutbound", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.VAPI_OUTBOUND_URL = "https://test.example.com/calls";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns success when upstream responds 200", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const result = await dispararLlamadaOutbound({
      perfilId: "telco-ejemplo",
      nombre: "Juan",
      telefono: "5512345678",
      resumen: "test",
    });

    expect(result.success).toBe(true);
    expect(result.payload.customer_phone).toBe("5512345678");
  });

  it("returns failure when profile is not supported and does not call fetch", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const result = await dispararLlamadaOutbound({
      perfilId: "megacable",
      nombre: "Juan",
      telefono: "5512345678",
      resumen: "test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("profile_not_supported");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns failure when upstream returns non-2xx", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const result = await dispararLlamadaOutbound({
      perfilId: "telco-ejemplo",
      nombre: "Juan",
      telefono: "5512345678",
      resumen: "test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("upstream_500");
  });

  it("returns failure when fetch throws (network error)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await dispararLlamadaOutbound({
      perfilId: "telco-ejemplo",
      nombre: "Juan",
      telefono: "5512345678",
      resumen: "test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("ECONNREFUSED");
  });
});
