"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Canal = "whatsapp" | "sms" | "web" | "facebook" | "instagram" | "voz";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CanalInfo {
  id: Canal;
  nombre: string;
  color: string;
  bgColor: string;
  icon: string;
}

interface PerfilData {
  nombre: string;
  nombreCorto: string;
  logo: string;
  colores: { primario: string; secundario: string; acento: string; fondo: string };
  canalesHabilitados: string[];
}

const ALL_CANALES: CanalInfo[] = [
  { id: "whatsapp", nombre: "WhatsApp", color: "#25D366", bgColor: "#dcf8c6", icon: "💬" },
  { id: "sms", nombre: "SMS", color: "#5B5EA6", bgColor: "#e8e8f0", icon: "📱" },
  { id: "web", nombre: "Web Chat", color: "#2563EB", bgColor: "#dbeafe", icon: "🌐" },
  { id: "facebook", nombre: "Messenger", color: "#1877F2", bgColor: "#e3f0ff", icon: "📘" },
  { id: "instagram", nombre: "Instagram", color: "#E4405F", bgColor: "#fce4ec", icon: "📸" },
  { id: "voz", nombre: "Voz", color: "#F59E0B", bgColor: "#fef3c7", icon: "📞" },
];

export default function ClientePage() {
  const [canalSeleccionado, setCanalSeleccionado] = useState<Canal | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [casoCreado, setCasoCreado] = useState<{ numeroCaso: string; id: string } | null>(null);
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((data) => setPerfil(data.perfil));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const canalesDisponibles = ALL_CANALES.filter(
    (c) => !perfil || perfil.canalesHabilitados.includes(c.id)
  );
  const canal = canalesDisponibles.find((c) => c.id === canalSeleccionado);
  const nombreEmpresa = perfil?.nombreCorto || "Arena";
  const colorPrimario = perfil?.colores.primario || "#2563EB";

  const enviarMensaje = async () => {
    if (!input.trim() || cargando || !canalSeleccionado) return;

    const nuevoMensaje: Mensaje = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const nuevosMensajes = [...mensajes, nuevoMensaje];
    setMensajes(nuevosMensajes);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: nuevosMensajes.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          canal: canalSeleccionado,
        }),
      });

      const data = await res.json();

      const respuestaBot: Mensaje = {
        role: "assistant",
        content: data.mensaje,
        timestamp: new Date(),
      };

      setMensajes([...nuevosMensajes, respuestaBot]);

      if (data.casoListo) {
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

        await fetch("/api/routing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ casoId: caso.id }),
        });
      }
    } catch {
      setMensajes([
        ...nuevosMensajes,
        {
          role: "assistant",
          content: "Lo siento, ocurrió un error. Por favor intenta de nuevo.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  // Channel selection screen
  if (!canalSeleccionado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-medium text-sm" style={{ color: colorPrimario }}>
                ← Inicio
              </Link>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                {perfil && (
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    <span className="text-white font-bold text-xs">{perfil.logo.charAt(0)}</span>
                  </div>
                )}
                <h1 className="text-lg font-semibold text-gray-900">Portal del Cliente</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Elige tu canal de contacto</h2>
          <p className="text-gray-500 mb-8">Selecciona cómo quieres comunicarte con {nombreEmpresa}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl">
            {canalesDisponibles.map((c) => (
              <button
                key={c.id}
                onClick={() => setCanalSeleccionado(c.id)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100 hover:border-blue-200 flex flex-col items-center gap-3"
              >
                <span className="text-4xl">{c.icon}</span>
                <span className="font-medium text-gray-900">{c.nombre}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ─── Channel-specific helpers ───────────────────────────────
  const isSMS = canalSeleccionado === "sms";
  const isWeb = canalSeleccionado === "web";
  const isMessenger = canalSeleccionado === "facebook";
  const isInstagram = canalSeleccionado === "instagram";

  const goBack = () => {
    setCanalSeleccionado(null);
    setMensajes([]);
    setCasoCreado(null);
  };

  const renderBotAvatar = () => (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: colorPrimario }}
    >
      <span className="text-white text-xs font-bold">{perfil?.logo.charAt(0) || "A"}</span>
    </div>
  );

  const casoCard = casoCreado && (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center animate-fade-in">
      <p className="text-green-800 font-semibold mb-1">Caso creado exitosamente</p>
      <p className="text-green-600 text-sm mb-2">
        N&uacute;mero de seguimiento: <strong>{casoCreado.numeroCaso}</strong>
      </p>
      <Link
        href={`/agente/${casoCreado.id}`}
        className="inline-block text-xs text-white px-4 py-1.5 rounded-full transition-colors"
        style={{ backgroundColor: colorPrimario }}
      >
        Ver caso en consola del agente &rarr;
      </Link>
    </div>
  );

  // ─── SMS: iMessage-style ───────────────────────────────────
  if (isSMS) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
              &larr; Atr&aacute;s
            </button>
            <div className="text-center flex-1">
              <p className="font-semibold text-gray-900 text-sm">{nombreEmpresa}</p>
              <p className="text-xs text-gray-500">SMS</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-white">
          {mensajes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-xs mb-1">Mensajes de texto</p>
              <p className="text-gray-500 text-sm">{nombreEmpresa}</p>
            </div>
          )}

          {mensajes.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
              <div
                className={`max-w-xs md:max-w-sm px-4 py-2 shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                    : "bg-gray-200 text-gray-900 rounded-2xl rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${msg.role === "user" ? "text-white/50" : "text-gray-400"}`}>
                  {msg.timestamp.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {cargando && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
                </div>
              </div>
            </div>
          )}

          {casoCard}
          <div ref={chatEndRef} />
        </main>

        {!casoCreado && (
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
            <div className="flex gap-2 max-w-3xl mx-auto items-end">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 160))}
                onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                placeholder="Mensaje de texto"
                className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                disabled={cargando}
              />
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={enviarMensaje}
                  disabled={cargando || !input.trim()}
                  className="bg-blue-500 text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-30 transition-colors"
                >
                  <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
                <span className={`text-[10px] ${input.length > 140 ? "text-red-500" : "text-gray-400"}`}>
                  {input.length}/160
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Web Chat: floating widget style ────────────────────────
  if (isWeb) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Widget header */}
          <header className="px-4 py-3 flex items-center gap-3 text-white" style={{ backgroundColor: colorPrimario }}>
            <button onClick={goBack} className="text-white/70 hover:text-white text-xs">&larr;</button>
            {renderBotAvatar()}
            <div className="flex-1">
              <h1 className="font-semibold text-sm">{nombreEmpresa}</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                <p className="text-xs text-white/80">En l&iacute;nea</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full border border-white/40" />
              <div className="w-3 h-0.5 bg-white/40 self-end mb-0.5" />
            </div>
          </header>

          {/* Messages */}
          <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {mensajes.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: colorPrimario }}>
                  <span className="text-white text-lg font-bold">{perfil?.logo.charAt(0) || "A"}</span>
                </div>
                <p className="text-gray-900 font-semibold text-sm mb-1">Bienvenido</p>
                <p className="text-gray-500 text-xs">
                  Env&iacute;a un mensaje para iniciar la conversaci&oacute;n
                </p>
              </div>
            )}

            {mensajes.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                {msg.role === "assistant" && renderBotAvatar()}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: colorPrimario } : undefined}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 ${msg.role === "user" ? "text-white/50" : "text-gray-400"}`}>
                    {msg.timestamp.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex gap-2 justify-start animate-fade-in">
                {renderBotAvatar()}
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse-dot" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
                  </div>
                </div>
              </div>
            )}

            {casoCard}
            <div ref={chatEndRef} />
          </main>

          {/* Input */}
          {!casoCreado && (
            <div className="bg-white border-t border-gray-200 px-3 py-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50"
                  style={{ focusRingColor: colorPrimario } as React.CSSProperties}
                  disabled={cargando}
                />
                <button
                  onClick={enviarMensaje}
                  disabled={cargando || !input.trim()}
                  className="text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-30 transition-colors flex-shrink-0"
                  style={{ backgroundColor: colorPrimario }}
                >
                  <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Powered by */}
          <div className="bg-gray-50 border-t border-gray-100 py-1.5 text-center">
            <p className="text-[10px] text-gray-400">Powered by <span className="font-medium">Arena Analytics</span></p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Messenger style ────────────────────────────────────────
  if (isMessenger) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
          <button onClick={goBack} className="text-[#1877F2] hover:text-blue-700 text-sm font-medium">&larr;</button>
          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: colorPrimario }}>
              <span className="text-white font-bold text-xs">{perfil?.logo.charAt(0) || "A"}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">{nombreEmpresa}</h1>
            <p className="text-xs text-green-600">Activo ahora</p>
          </div>
          <div className="ml-auto flex gap-3 text-[#1877F2]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5.5a2.5 2.5 0 012.5-2.5h1.172a2.5 2.5 0 012.353 1.658l.58 1.638a2.5 2.5 0 01-.619 2.56l-.5.5a11.25 11.25 0 005.608 5.608l.5-.5a2.5 2.5 0 012.56-.619l1.638.58A2.5 2.5 0 0120.5 16.828V18.5a2.5 2.5 0 01-2.5 2.5h-.5C9.544 21 3 14.456 3 6.5v-.5z" /></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-white">
          {mensajes.length === 0 && (
            <div className="text-center py-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: colorPrimario }}>
                <span className="text-white text-xl font-bold">{perfil?.logo.charAt(0) || "A"}</span>
              </div>
              <p className="font-semibold text-gray-900">{nombreEmpresa}</p>
              <p className="text-xs text-gray-500 mt-0.5">Suele responder al instante</p>
            </div>
          )}

          {mensajes.map((msg, i) => (
            <div key={i} className={`flex gap-2 items-end ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5" style={{ backgroundColor: colorPrimario }}>
                  <span className="text-white text-[9px] font-bold">{perfil?.logo.charAt(0) || "A"}</span>
                </div>
              )}
              <div
                className={`max-w-xs md:max-w-sm px-3.5 py-2 ${
                  msg.role === "user"
                    ? "bg-[#1877F2] text-white rounded-full"
                    : "bg-gray-100 text-gray-900 rounded-full"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {cargando && (
            <div className="flex gap-2 items-end justify-start animate-fade-in">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colorPrimario }}>
                <span className="text-white text-[9px] font-bold">{perfil?.logo.charAt(0) || "A"}</span>
              </div>
              <div className="bg-gray-100 rounded-full px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
                </div>
              </div>
            </div>
          )}

          {casoCard}
          <div ref={chatEndRef} />
        </main>

        {!casoCreado && (
          <div className="bg-white border-t border-gray-100 px-4 py-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                placeholder="Aa"
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                disabled={cargando}
              />
              {input.trim() ? (
                <button
                  onClick={enviarMensaje}
                  disabled={cargando}
                  className="text-[#1877F2] font-semibold text-sm disabled:opacity-30 transition-colors"
                >
                  <svg className="w-6 h-6 rotate-90" fill="#1877F2" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
              ) : (
                <span className="text-2xl">👍</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Instagram DM style ─────────────────────────────────────
  if (isInstagram) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
          <button onClick={goBack} className="text-gray-900 hover:text-gray-600 text-lg">&larr;</button>
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
            >
              <span className="text-white font-bold text-xs">{perfil?.logo.charAt(0) || "A"}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 text-sm">{nombreEmpresa}</h1>
            <p className="text-xs text-gray-500">Activo(a) ahora</p>
          </div>
          <div className="flex gap-3 text-gray-900">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5.5a2.5 2.5 0 012.5-2.5h1.172a2.5 2.5 0 012.353 1.658l.58 1.638a2.5 2.5 0 01-.619 2.56l-.5.5a11.25 11.25 0 005.608 5.608l.5-.5a2.5 2.5 0 012.56-.619l1.638.58A2.5 2.5 0 0120.5 16.828V18.5a2.5 2.5 0 01-2.5 2.5h-.5C9.544 21 3 14.456 3 6.5v-.5z" /></svg>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 bg-white">
          {mensajes.length === 0 && (
            <div className="text-center py-8 flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
                style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
              >
                <span className="text-white text-2xl font-bold">{perfil?.logo.charAt(0) || "A"}</span>
              </div>
              <p className="font-semibold text-gray-900">{nombreEmpresa}</p>
              <p className="text-xs text-gray-400 mt-1">{perfil?.nombre || ""} &bull; Instagram</p>
            </div>
          )}

          {mensajes.map((msg, i) => (
            <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
              {msg.role === "assistant" && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                >
                  <span className="text-white text-[9px] font-bold">{perfil?.logo.charAt(0) || "A"}</span>
                </div>
              )}
              <div
                className={`max-w-xs md:max-w-sm px-3.5 py-2 ${
                  msg.role === "user"
                    ? "bg-[#3797F0] text-white rounded-3xl rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-3xl rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {cargando && (
            <div className="flex gap-2 items-end justify-start animate-fade-in">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
              >
                <span className="text-white text-[9px] font-bold">{perfil?.logo.charAt(0) || "A"}</span>
              </div>
              <div className="bg-gray-100 rounded-3xl px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
                </div>
              </div>
            </div>
          )}

          {casoCard}
          <div ref={chatEndRef} />
        </main>

        {!casoCreado && (
          <div className="bg-white border-t border-gray-100 px-4 py-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                placeholder="Enviar mensaje..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                disabled={cargando}
              />
              {input.trim() ? (
                <button
                  onClick={enviarMensaje}
                  disabled={cargando}
                  className="text-[#3797F0] font-semibold text-sm disabled:opacity-30"
                >
                  Enviar
                </button>
              ) : (
                <span className="text-xl">❤️</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── WhatsApp & default (Voz uses default too) ──────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Chat header */}
      <header
        className="text-white px-4 py-3 flex items-center justify-between shadow-md"
        style={{ backgroundColor: canal?.color || colorPrimario }}
      >
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="text-white/80 hover:text-white text-sm">
            &larr; Cambiar canal
          </button>
          <span className="text-white/50">|</span>
          <span className="text-2xl">{canal?.icon}</span>
          <div>
            <h1 className="font-semibold">{nombreEmpresa}</h1>
            <p className="text-xs text-white/70">
              {canal?.nombre} &bull; Asistente virtual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-xs text-white/70">En l&iacute;nea</span>
        </div>
      </header>

      {/* Chat messages */}
      <main
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ backgroundColor: canal?.bgColor || "#f3f4f6" }}
      >
        {mensajes.length === 0 && (
          <div className="text-center py-8">
            <span className="text-5xl mb-4 block">{canal?.icon}</span>
            <p className="text-gray-600 text-sm">
              Inicia la conversaci&oacute;n con el asistente virtual de {nombreEmpresa}
            </p>
          </div>
        )}

        {mensajes.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 shadow-sm ${
                msg.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-white text-gray-900 rounded-bl-sm"
              }`}
              style={msg.role === "user" ? { backgroundColor: colorPrimario } : undefined}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.role === "user" ? "text-white/60" : "text-gray-400"
                }`}
              >
                {msg.timestamp.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }}></div>
              </div>
            </div>
          </div>
        )}

        {casoCard}
        <div ref={chatEndRef} />
      </main>

      {/* Input */}
      {!casoCreado && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={cargando}
            />
            <button
              onClick={enviarMensaje}
              disabled={cargando || !input.trim()}
              className="text-white rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: colorPrimario }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
