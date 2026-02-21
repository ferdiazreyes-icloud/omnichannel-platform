"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────
type Canal = "whatsapp" | "sms" | "web" | "facebook" | "instagram" | "voz";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PerfilData {
  nombre: string;
  nombreCorto: string;
  logo: string;
  colores: { primario: string; secundario: string; acento: string; fondo: string };
  canalesHabilitados: string[];
}

interface Caso {
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
  createdAt: string;
  updatedAt: string;
  agente: { id: string; nombre: string; equipo: string } | null;
  _count: { interacciones: number };
}

interface Metricas {
  resumen: {
    totalCasos: number;
    casosActivos: number;
    casosEnRiesgoSLA: number;
    casosVencidosSLA: number;
    tiempoPromedioPrimeraRespuesta: number;
    tiempoPromedioResolucion: number;
    slaRespuestaCompliance: number;
    slaResolucionCompliance: number;
    csatPromedio: number;
  };
  porEstado: Record<string, number>;
  porCanal: Record<string, number>;
  porIntencion: Record<string, number>;
  porPrioridad: Record<string, number>;
  porAgente: Array<{ nombre: string; activos: number; total: number }>;
}

interface EventoActividad {
  id: string;
  tipo: "chat" | "bot" | "caso" | "routing" | "sla" | "sistema";
  mensaje: string;
  timestamp: Date;
  color: string;
  icon: string;
}

// ─── Constants ──────────────────────────────────────────────────
const CANALES: Record<Canal, { nombre: string; color: string; bgColor: string; icon: string }> = {
  whatsapp: { nombre: "WhatsApp", color: "#25D366", bgColor: "#dcf8c6", icon: "💬" },
  sms: { nombre: "SMS", color: "#5B5EA6", bgColor: "#e8e8f0", icon: "📱" },
  web: { nombre: "Web Chat", color: "#2563EB", bgColor: "#dbeafe", icon: "🌐" },
  facebook: { nombre: "Messenger", color: "#1877F2", bgColor: "#e3f0ff", icon: "📘" },
  instagram: { nombre: "Instagram", color: "#E4405F", bgColor: "#fce4ec", icon: "📸" },
  voz: { nombre: "Voz", color: "#F59E0B", bgColor: "#fef3c7", icon: "📞" },
};

const CANAL_ICONS: Record<string, string> = {
  whatsapp: "💬", sms: "📱", web: "🌐", facebook: "📘", instagram: "📸", voz: "📞",
};

const ESTADO_COLORS: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-700",
  asignado: "bg-cyan-100 text-cyan-700",
  en_curso: "bg-yellow-100 text-yellow-700",
  escalado: "bg-red-100 text-red-700",
  resuelto: "bg-green-100 text-green-700",
  cerrado: "bg-gray-100 text-gray-600",
};

const PRIORIDAD_COLORS: Record<string, string> = {
  alta: "bg-red-100 text-red-700",
  media: "bg-yellow-100 text-yellow-700",
  baja: "bg-green-100 text-green-700",
};

const ESTADO_PIE_COLORS: Record<string, string> = {
  nuevo: "#3B82F6", asignado: "#06B6D4", en_curso: "#F59E0B",
  escalado: "#EF4444", resuelto: "#22C55E", cerrado: "#9CA3AF",
};

const CANAL_BAR_COLORS: Record<string, string> = {
  whatsapp: "#25D366", sms: "#5B5EA6", web: "#2563EB",
  facebook: "#1877F2", instagram: "#E4405F", voz: "#F59E0B",
};

// ─── Main Component ─────────────────────────────────────────────
export default function DemoPage() {
  // Shared state
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [eventos, setEventos] = useState<EventoActividad[]>([]);
  const actividadRef = useRef<HTMLDivElement>(null);

  // Chat panel state
  const [canalSeleccionado, setCanalSeleccionado] = useState<Canal | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [casoCreado, setCasoCreado] = useState<{ numeroCaso: string; id: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Agent panel state
  const [casos, setCasos] = useState<Caso[]>([]);
  const [totalCasos, setTotalCasos] = useState(0);
  const [casosLoading, setCasosLoading] = useState(true);
  const [casoHighlight, setCasoHighlight] = useState<string | null>(null);

  // Dashboard panel state
  const [metricas, setMetricas] = useState<Metricas | null>(null);

  const colorPrimario = perfil?.colores.primario || "#2563EB";

  // ─── Activity feed helper ───────────────────────────────────
  const agregarEvento = useCallback((tipo: EventoActividad["tipo"], mensaje: string, icon: string, color: string) => {
    const evento: EventoActividad = {
      id: Date.now().toString() + Math.random(),
      tipo, mensaje, icon, color,
      timestamp: new Date(),
    };
    setEventos((prev) => [evento, ...prev].slice(0, 50));
  }, []);

  // ─── Load profile ───────────────────────────────────────────
  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((data) => {
        setPerfil(data.perfil);
        agregarEvento("sistema", `Perfil cargado: ${data.perfil.nombreCorto}`, "🏢", "#6B7280");
      });
  }, [agregarEvento]);

  // ─── Load cases ─────────────────────────────────────────────
  const cargarCasos = useCallback(async () => {
    try {
      const res = await fetch("/api/casos?limit=20");
      const data = await res.json();
      setCasos(data.casos);
      setTotalCasos(data.total);
      setCasosLoading(false);
    } catch {
      setCasosLoading(false);
    }
  }, []);

  useEffect(() => { cargarCasos(); }, [cargarCasos]);

  // ─── Load metrics ───────────────────────────────────────────
  const cargarMetricas = useCallback(async () => {
    try {
      const res = await fetch("/api/metricas");
      const data = await res.json();
      setMetricas(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    cargarMetricas();
    const interval = setInterval(cargarMetricas, 15000);
    return () => clearInterval(interval);
  }, [cargarMetricas]);

  // ─── SSE for real-time ──────────────────────────────────────
  useEffect(() => {
    const evtSource = new EventSource("/api/sse");
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update") {
        cargarCasos();
        cargarMetricas();
      }
    };
    return () => evtSource.close();
  }, [cargarCasos, cargarMetricas]);

  // ─── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    actividadRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [eventos]);

  // ─── Chat logic ─────────────────────────────────────────────
  const seleccionarCanal = (canal: Canal) => {
    setCanalSeleccionado(canal);
    setMensajes([]);
    setCasoCreado(null);
    agregarEvento("chat", `Cliente conectado por ${CANALES[canal].nombre}`, CANALES[canal].icon, CANALES[canal].color);
  };

  const enviarMensaje = async () => {
    if (!input.trim() || cargando || !canalSeleccionado) return;

    const nuevoMensaje: Mensaje = { role: "user", content: input.trim(), timestamp: new Date() };
    const nuevosMensajes = [...mensajes, nuevoMensaje];
    setMensajes(nuevosMensajes);
    setInput("");
    setCargando(true);

    agregarEvento("chat", `Cliente: "${input.trim().substring(0, 60)}${input.trim().length > 60 ? "..." : ""}"`, "👤", "#3B82F6");

    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: nuevosMensajes.map((m) => ({ role: m.role, content: m.content })),
          canal: canalSeleccionado,
        }),
      });

      const data = await res.json();
      const respuestaBot: Mensaje = { role: "assistant", content: data.mensaje, timestamp: new Date() };
      setMensajes([...nuevosMensajes, respuestaBot]);

      agregarEvento("bot", `Bot respondió (${data.intencion ? `intención: ${data.intencion}` : "detectando intención..."})`, "🤖", "#8B5CF6");

      if (data.datosCapturados?.nombre) {
        agregarEvento("bot", `Dato capturado: nombre → ${data.datosCapturados.nombre}`, "📋", "#8B5CF6");
      }
      if (data.datosCapturados?.contacto) {
        agregarEvento("bot", `Dato capturado: contacto → ${data.datosCapturados.contacto}`, "📋", "#8B5CF6");
      }

      if (data.casoListo) {
        agregarEvento("caso", "Bot completó recopilación — creando caso...", "⚡", "#F59E0B");

        const casoRes = await fetch("/api/casos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canalOrigen: canalSeleccionado,
            clienteNombre: data.datosCapturados.nombre || "Cliente",
            clienteContacto: data.datosCapturados.contacto || "Sin contacto",
            intencion: data.intencion || "informacion",
            categoria: data.categoria || "Consulta general",
            prioridad: data.prioridad || "media",
            resumen: data.datosCapturados.asunto || "Caso creado desde bot",
          }),
        });

        const caso = await casoRes.json();
        setCasoCreado(caso);
        agregarEvento("caso", `Caso ${caso.numeroCaso} creado — prioridad ${data.prioridad || "media"}`, "🎫", "#22C55E");

        // Route the case
        const routingRes = await fetch("/api/routing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ casoId: caso.id }),
        });
        const routingData = await routingRes.json();

        if (routingData.agente) {
          agregarEvento("routing", `Asignado a ${routingData.agente.nombre} (${routingData.agente.equipo})`, "🎯", "#06B6D4");
        }

        agregarEvento("sla", `SLA iniciado — respuesta: 15min, resolución: 24hrs`, "⏱️", "#F59E0B");

        // Refresh panels
        setCasoHighlight(caso.id);
        setTimeout(() => setCasoHighlight(null), 5000);
        await cargarCasos();
        await cargarMetricas();
      }
    } catch {
      setMensajes([
        ...nuevosMensajes,
        { role: "assistant", content: "Error al conectar con el bot. Intenta de nuevo.", timestamp: new Date() },
      ]);
      agregarEvento("sistema", "Error de conexión con el bot", "❌", "#EF4444");
    } finally {
      setCargando(false);
    }
  };

  const reiniciarChat = () => {
    setCanalSeleccionado(null);
    setMensajes([]);
    setCasoCreado(null);
    agregarEvento("sistema", "Chat reiniciado", "🔄", "#6B7280");
  };

  // ─── Derived data for dashboard ─────────────────────────────
  const estadoData = metricas
    ? Object.entries(metricas.porEstado).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
        fill: ESTADO_PIE_COLORS[name] || "#9CA3AF",
      }))
    : [];

  const canalData = metricas
    ? Object.entries(metricas.porCanal).map(([name, value]) => ({
        name,
        value,
        fill: CANAL_BAR_COLORS[name] || "#9CA3AF",
      }))
    : [];

  const canal = canalSeleccionado ? CANALES[canalSeleccionado] : null;

  // ─── Loading ────────────────────────────────────────────────
  if (!perfil) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Cargando Command Center...</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Inicio
          </Link>
          <div className="w-px h-5 bg-gray-700" />
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ backgroundColor: colorPrimario }}
          >
            <span className="text-white font-bold text-xs">{perfil.logo.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">{perfil.nombreCorto} — Command Center</h1>
            <p className="text-xs text-gray-500">Vista End-to-End en Tiempo Real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">En vivo</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
            {totalCasos} casos
          </span>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ═══ LEFT: Client Simulator ═══ */}
        <div className="w-[380px] flex-shrink-0 border-r border-gray-700 flex flex-col bg-gray-800">
          <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">💬</span>
              <h2 className="text-sm font-semibold text-white">Simulador de Cliente</h2>
            </div>
            {canalSeleccionado && (
              <button
                onClick={reiniciarChat}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Reiniciar
              </button>
            )}
          </div>

          {!canalSeleccionado ? (
            /* Channel selector */
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <p className="text-gray-400 text-sm mb-4">Selecciona canal</p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
                {(perfil.canalesHabilitados as Canal[]).map((canalId) => {
                  const c = CANALES[canalId];
                  if (!c) return null;
                  return (
                    <button
                      key={canalId}
                      onClick={() => seleccionarCanal(canalId)}
                      className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 flex flex-col items-center gap-1.5 transition-colors border border-gray-600 hover:border-gray-500"
                    >
                      <span className="text-2xl">{c.icon}</span>
                      <span className="text-xs text-gray-300 font-medium">{c.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Chat interface */
            <>
              {/* Chat header */}
              <div
                className="px-3 py-2 flex items-center gap-2"
                style={{ backgroundColor: canal!.color + "20" }}
              >
                <span className="text-lg">{canal!.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{perfil.nombreCorto}</p>
                  <p className="text-xs" style={{ color: canal!.color }}>{canal!.nombre} &bull; Bot activo</p>
                </div>
                <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
                style={{ backgroundColor: canal!.bgColor + "15" }}
              >
                {mensajes.length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-3xl block mb-2">{canal!.icon}</span>
                    <p className="text-gray-500 text-xs">Escribe algo para iniciar la conversación</p>
                  </div>
                )}

                {mensajes.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                        msg.role === "user"
                          ? "text-white rounded-br-sm"
                          : "bg-white text-gray-900 rounded-bl-sm"
                      }`}
                      style={msg.role === "user" ? { backgroundColor: colorPrimario } : undefined}
                    >
                      <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-0.5 ${msg.role === "user" ? "text-white/50" : "text-gray-400"}`}>
                        {msg.timestamp.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}

                {cargando && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
                      </div>
                    </div>
                  </div>
                )}

                {casoCreado && (
                  <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-center animate-fade-in">
                    <p className="text-green-400 font-semibold text-xs mb-1">Caso creado</p>
                    <p className="text-green-300 text-[11px] font-mono">{casoCreado.numeroCaso}</p>
                    <p className="text-green-500/60 text-[10px] mt-1">Visible en la consola →</p>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {!casoCreado && (
                <div className="bg-gray-800 border-t border-gray-700 px-3 py-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-full px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={cargando}
                    />
                    <button
                      onClick={enviarMensaje}
                      disabled={cargando || !input.trim()}
                      className="text-white rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-30 transition-colors"
                      style={{ backgroundColor: colorPrimario }}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}
              {casoCreado && (
                <div className="bg-gray-800 border-t border-gray-700 px-3 py-2">
                  <button
                    onClick={reiniciarChat}
                    className="w-full text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg py-2 transition-colors"
                  >
                    Nueva conversación
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ CENTER+RIGHT Area ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ── Top: Agent Console ── */}
          <div className="flex-1 flex overflow-hidden">
            {/* Agent case list */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎧</span>
                  <h2 className="text-sm font-semibold text-white">Consola del Agente</h2>
                  <span className="text-xs text-gray-500">({totalCasos} casos)</span>
                </div>
                <button
                  onClick={cargarCasos}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Actualizar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-850" style={{ backgroundColor: "#1a1f2e" }}>
                {casosLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
                  </div>
                ) : casos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <span className="text-3xl mb-2">📭</span>
                    <p className="text-sm">Sin casos aún</p>
                    <p className="text-xs text-gray-600 mt-1">Usa el simulador para crear uno</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700/50">
                    {casos.map((caso) => (
                      <Link
                        key={caso.id}
                        href={`/agente/${caso.id}`}
                        className={`block px-4 py-3 hover:bg-gray-700/30 transition-all ${
                          casoHighlight === caso.id ? "demo-highlight" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span>{CANAL_ICONS[caso.canalOrigen] || "?"}</span>
                            <span className="text-xs font-mono text-gray-400">{caso.numeroCaso}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORIDAD_COLORS[caso.prioridad]}`}>
                              {caso.prioridad}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ESTADO_COLORS[caso.estado]}`}>
                              {caso.estado.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-white">{caso.clienteNombre}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 truncate max-w-[60%]">
                            {caso.categoria}
                          </p>
                          <p className="text-xs text-gray-600">
                            {caso.agente ? caso.agente.nombre : "Sin asignar"}
                          </p>
                        </div>
                        {caso.slaPrimeraRespuesta && (
                          <SLAMini sla={caso.slaPrimeraRespuesta} completedAt={caso.primeraRespuestaAt} />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Activity Feed (right sidebar) ── */}
            <div className="w-[280px] flex-shrink-0 border-l border-gray-700 bg-gray-800 flex flex-col">
              <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <h2 className="text-sm font-semibold text-white">Actividad en Vivo</h2>
              </div>
              <div className="flex-1 overflow-y-auto" ref={actividadRef}>
                {eventos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <span className="text-2xl mb-2">📡</span>
                    <p className="text-xs">Esperando actividad...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700/30">
                    {eventos.map((evento) => (
                      <div key={evento.id} className="px-3 py-2 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <span className="text-sm flex-shrink-0 mt-0.5">{evento.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-300 leading-relaxed">{evento.mensaje}</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">
                              {evento.timestamp.toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Bottom: Dashboard ── */}
          <div className="h-[220px] flex-shrink-0 border-t border-gray-700 bg-gray-800 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">📊</span>
                <h2 className="text-sm font-semibold text-white">Dashboard Operacional</h2>
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-gray-500">Auto-refresh</span>
                </div>
              </div>
              <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
                Ver completo →
              </Link>
            </div>

            {metricas ? (
              <div className="flex-1 flex overflow-hidden px-4 py-2 gap-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-2 w-[220px] flex-shrink-0 content-start">
                  <MiniKPI label="Activos" value={metricas.resumen.casosActivos} color="#3B82F6" />
                  <MiniKPI
                    label="SLA Resp."
                    value={`${metricas.resumen.slaRespuestaCompliance}%`}
                    color={metricas.resumen.slaRespuestaCompliance >= 80 ? "#22C55E" : "#EF4444"}
                  />
                  <MiniKPI
                    label="En riesgo"
                    value={metricas.resumen.casosEnRiesgoSLA}
                    color="#F59E0B"
                  />
                  <MiniKPI
                    label="Vencidos"
                    value={metricas.resumen.casosVencidosSLA}
                    color="#EF4444"
                  />
                </div>

                {/* Cases by State - Pie */}
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wider">Por Estado</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={estadoData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        innerRadius={30}
                        paddingAngle={2}
                      >
                        {estadoData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }}
                        itemStyle={{ color: "#d1d5db" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Cases by Channel - Bar */}
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wider">Por Canal</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={canalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6B7280" }} />
                      <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} width={25} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }}
                        itemStyle={{ color: "#d1d5db" }}
                      />
                      <Bar dataKey="value" name="Casos" radius={[2, 2, 0, 0]}>
                        {canalData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Agent Load */}
                <div className="w-[200px] flex-shrink-0">
                  <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wider">Carga Agentes</p>
                  <div className="space-y-1.5 overflow-y-auto max-h-[140px]">
                    {metricas.porAgente.slice(0, 6).map((agente) => (
                      <div key={agente.nombre} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-[80px] truncate">{agente.nombre}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min((agente.activos / 10) * 100, 100)}%`,
                              backgroundColor: agente.activos > 7 ? "#EF4444" : agente.activos > 4 ? "#F59E0B" : "#22C55E",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 w-[16px] text-right">{agente.activos}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────
function MiniKPI({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-gray-700/50 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function SLAMini({ sla, completedAt }: { sla: string; completedAt: string | null }) {
  const deadline = new Date(sla);
  const now = completedAt ? new Date(completedAt) : new Date();
  const minutesLeft = (deadline.getTime() - now.getTime()) / (1000 * 60);

  let bg = "bg-green-900/30";
  let text = "text-green-400";
  let label = "SLA OK";
  if (minutesLeft < 0) {
    bg = "bg-red-900/30";
    text = "text-red-400";
    label = "SLA Vencido";
  } else if (minutesLeft < 30) {
    bg = "bg-yellow-900/30";
    text = "text-yellow-400";
    label = `SLA ${Math.round(minutesLeft)}m`;
  }

  return (
    <span className={`inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded ${bg} ${text} font-medium`}>
      {label}
    </span>
  );
}
