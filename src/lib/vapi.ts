const DEFAULT_URL =
  "https://exitus-comms-api.dev.exituscloud.net/api/v1/calls/outbound";

const TELCO_FROM_NUMBER = "3341700562";
const TELCO_DESTINATION = "demo-telco-dev";

export interface DispararLlamadaInput {
  perfilId: string;
  nombre: string;
  telefono: string;
  resumen: string;
}

export interface DispararLlamadaResult {
  success: boolean;
  error?: string;
  payload: OutboundPayload;
}

export interface OutboundPayload {
  from_number: string;
  customer_phone: string;
  destination: string;
  params: {
    name: string;
    note: string;
  };
}

export function construirPayload(input: DispararLlamadaInput): OutboundPayload {
  return {
    from_number: TELCO_FROM_NUMBER,
    customer_phone: input.telefono.replace(/\D/g, "").slice(-10),
    destination: TELCO_DESTINATION,
    params: {
      name: input.nombre,
      note: input.resumen,
    },
  };
}

export function perfilSoportaLlamada(perfilId: string): boolean {
  return perfilId === "telco-ejemplo";
}

export async function dispararLlamadaOutbound(
  input: DispararLlamadaInput
): Promise<DispararLlamadaResult> {
  const payload = construirPayload(input);

  if (!perfilSoportaLlamada(input.perfilId)) {
    return {
      success: false,
      error: "profile_not_supported",
      payload,
    };
  }

  const url = process.env.VAPI_OUTBOUND_URL || DEFAULT_URL;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `upstream_${response.status}`,
        payload,
      };
    }

    return { success: true, payload };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "network_error",
      payload,
    };
  }
}
