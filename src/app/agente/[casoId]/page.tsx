"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface Interaccion {
  id: string;
  tipo: string;
  contenido: string;
  canal: string;
  createdAt: string;
}

interface Agente {
  id: string;
  nombre: string;
  equipo: string;
}

interface CasoDetalle {
  id: string;
  numeroCaso: string;
  canalOrigen: string;
  clienteNombre: string;
  clienteContacto: string;
  intencion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  resumen: string | null;
  slaPrimeraRespuesta: string | null;
  slaResolucion: string | null;
  primeraRespuestaAt: string | null;
  resolvedAt: string | null;
  csat: number | null;
  createdAt: string;
  updatedAt: string;
  agente: Agente | null;
  interacciones: Interaccion[];
}

const CANAL_ICONS: Record<string, string> = {
  whatsapp: "💬", sms: "📱", web: "🌐", facebook: "📘", instagram: "📸", voz: "📞", sistema: "⚙️",
};

const TIPO_COLORS: Record<string, string> = {
  cliente: "bg-blue-50 border-blue-200",
  bot: "bg-green-50 border-green-200",
  agente: "bg-purple-50 border-purple-200",
  sistema: "bg-gray-50 border-gray-200",
};

const ESTADO_COLORS: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-700",
  asignado: "bg-cyan-100 text-cyan-700",
  en_curso: "bg-yellow-100 text-yellow-700",
  escalado: "bg-red-100 text-red-700",
  resuelto: "bg-green-100 text-green-700",
  cerrado: "bg-gray-100 text-gray-600",
};

export default function CasoDetallePage({ params }: { params: Promise<{ casoId: string }> }) {
  const { casoId } = use(params);
  const [caso, setCaso] = useState<CasoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [respuesta, setRespuesta] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sugerencia, setSugerencia] = useState("");
  const [cargandoSugerencia, setCargandoSugerencia] = useState(false);
  const [perfilColor, setPerfilColor] = useState("#2563EB");

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((data) => setPerfilColor(data.perfil?.colores?.primario || "#2563EB"));
  }, []);

  const cargarCaso = async () => {
    const res = await fetch(`/api/casos/${casoId}`);
    if (res.ok) {
      const data = await res.json();
      setCaso(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarCaso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casoId]);

  const actualizarCaso = async (updates: Record<string, unknown>) => {
    setEnviando(true);
    await fetch(`/api/casos/${casoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await cargarCaso();
    setEnviando(false);
  };

  const enviarRespuesta = async () => {
    if (!respuesta.trim()) return;
    await actualizarCaso({ respuesta: respuesta.trim(), estado: caso?.estado === "asignado" ? "en_curso" : undefined });
    setRespuesta("");
  };

  const enviarNota = async () => {
    if (!nota.trim()) return;
    await actualizarCaso({ nota: nota.trim() });
    setNota("");
  };

  const pedirSugerencia = async () => {
    if (!caso) return;
    setCargandoSugerencia(true);
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: [
            { role: "user", content: `Caso: ${caso.categoria}. Cliente: ${caso.clienteNombre}. Prioridad: ${caso.prioridad}. Sugiere una respuesta profesional.` },
          ],
          canal: caso.canalOrigen,
        }),
      });
      const data = await res.json();
      setSugerencia(data.mensaje);
    } catch {
      setSugerencia("No se pudo generar una sugerencia.");
    }
    setCargandoSugerencia(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Caso no encontrado</p>
          <Link href="/agente" className="text-blue-600 hover:text-blue-700">
            ← Volver a la bandeja
          </Link>
        </div>
      </div>
    );
  }

  const slaResolucionDate = caso.slaResolucion ? new Date(caso.slaResolucion) : null;
  const slaMinutesLeft = slaResolucionDate
    ? (slaResolucionDate.getTime() - Date.now()) / (1000 * 60)
    : null;

  let slaClass = "text-green-600 bg-green-50 border-green-200";
  let slaLabel = "A tiempo";
  if (slaMinutesLeft !== null) {
    if (slaMinutesLeft < 0) {
      slaClass = "text-red-600 bg-red-50 border-red-200";
      slaLabel = `Vencido (${Math.abs(Math.round(slaMinutesLeft))}m)`;
    } else if (slaMinutesLeft < 30) {
      slaClass = "text-yellow-600 bg-yellow-50 border-yellow-200";
      slaLabel = `${Math.round(slaMinutesLeft)}m restantes`;
    } else {
      slaLabel = `${Math.round(slaMinutesLeft / 60)}h restantes`;
    }
  }

  const isClosed = ["resuelto", "cerrado"].includes(caso.estado);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/agente" className="font-medium text-sm" style={{ color: perfilColor }}>
              ← Bandeja
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-mono text-sm text-gray-500">{caso.numeroCaso}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[caso.estado]}`}>
              {caso.estado.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">Inicio</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {/* SLA Bar */}
            <div className={`rounded-lg border p-3 flex items-center justify-between ${slaClass}`}>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">SLA Resolución:</span>
                <span className="text-sm">{slaLabel}</span>
              </div>
              {slaResolucionDate && (
                <span className="text-xs">
                  Deadline: {slaResolucionDate.toLocaleString("es-MX")}
                </span>
              )}
            </div>

            {/* Interactions Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Timeline de Interacciones</h2>
              <div className="space-y-3">
                {caso.interacciones.map((inter) => (
                  <div
                    key={inter.id}
                    className={`rounded-lg border p-3 animate-fade-in ${TIPO_COLORS[inter.tipo] || "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{CANAL_ICONS[inter.canal] || "💬"}</span>
                        <span className="text-xs font-medium text-gray-600 uppercase">
                          {inter.tipo}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(inter.createdAt).toLocaleString("es-MX")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{inter.contenido}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Area */}
            {!isClosed && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Responder al cliente</h2>
                  <button
                    onClick={pedirSugerencia}
                    disabled={cargandoSugerencia}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 disabled:opacity-50"
                  >
                    {cargandoSugerencia ? "Generando..." : "Sugerencia AI"}
                  </button>
                </div>

                {sugerencia && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-purple-800 mb-2">{sugerencia}</p>
                    <button
                      onClick={() => { setRespuesta(sugerencia); setSugerencia(""); }}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Usar esta sugerencia
                    </button>
                  </div>
                )}

                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder={`Responder vía ${caso.canalOrigen}...`}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Canal: {CANAL_ICONS[caso.canalOrigen]} {caso.canalOrigen}
                  </span>
                  <button
                    onClick={enviarRespuesta}
                    disabled={enviando || !respuesta.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {enviando ? "Enviando..." : "Enviar respuesta"}
                  </button>
                </div>

                {/* Internal note */}
                <details className="border-t border-gray-200 pt-3">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    Agregar nota interna
                  </summary>
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Nota visible solo para el equipo..."
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                      rows={2}
                    />
                    <button
                      onClick={enviarNota}
                      disabled={enviando || !nota.trim()}
                      className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
                    >
                      Guardar nota
                    </button>
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Right: Context Panel */}
          <div className="space-y-4">
            {/* Client Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Datos del Cliente</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Nombre</dt>
                  <dd className="font-medium text-gray-900">{caso.clienteNombre}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Contacto</dt>
                  <dd className="text-gray-900 text-xs">{caso.clienteContacto}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Canal</dt>
                  <dd>{CANAL_ICONS[caso.canalOrigen]} {caso.canalOrigen}</dd>
                </div>
              </dl>
            </div>

            {/* Case Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Información del Caso</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Intención</dt>
                  <dd className="font-medium text-gray-900">{caso.intencion}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Categoría</dt>
                  <dd className="text-gray-900">{caso.categoria}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Creado</dt>
                  <dd className="text-gray-900 text-xs">
                    {new Date(caso.createdAt).toLocaleString("es-MX")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Agente</dt>
                  <dd className="text-gray-900">{caso.agente?.nombre || "Sin asignar"}</dd>
                </div>
                {caso.csat && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">CSAT</dt>
                    <dd className="text-gray-900">{"★".repeat(caso.csat)}{"☆".repeat(5 - caso.csat)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Actions */}
            {!isClosed && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Acciones</h3>
                <div className="space-y-2">
                  {caso.estado !== "en_curso" && (
                    <button
                      onClick={() => actualizarCaso({ estado: "en_curso" })}
                      disabled={enviando}
                      className="w-full text-sm bg-yellow-100 text-yellow-700 py-2 rounded-lg hover:bg-yellow-200 font-medium disabled:opacity-50"
                    >
                      Marcar en curso
                    </button>
                  )}
                  <button
                    onClick={() => actualizarCaso({ estado: "escalado" })}
                    disabled={enviando}
                    className="w-full text-sm bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 font-medium disabled:opacity-50"
                  >
                    Escalar caso
                  </button>
                  <button
                    onClick={() => actualizarCaso({ estado: "resuelto" })}
                    disabled={enviando}
                    className="w-full text-sm bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 font-medium disabled:opacity-50"
                  >
                    Marcar resuelto
                  </button>
                  <button
                    onClick={() => actualizarCaso({ estado: "cerrado" })}
                    disabled={enviando}
                    className="w-full text-sm bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
                  >
                    Cerrar caso
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
