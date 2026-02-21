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
                <h1 className="text-lg font-semibold text-gray-900">Simulador de Canal</h1>
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

  // Chat interface
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Chat header */}
      <header
        className="text-white px-4 py-3 flex items-center justify-between shadow-md"
        style={{ backgroundColor: canal?.color || colorPrimario }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCanalSeleccionado(null);
              setMensajes([]);
              setCasoCreado(null);
            }}
            className="text-white/80 hover:text-white text-sm"
          >
            ← Cambiar canal
          </button>
          <span className="text-white/50">|</span>
          <span className="text-2xl">{canal?.icon}</span>
          <div>
            <h1 className="font-semibold">{nombreEmpresa}</h1>
            <p className="text-xs text-white/70">
              {canal?.nombre} • En línea
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-xs text-white/70">Bot activo</span>
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
              Inicia la conversación con el asistente virtual de {nombreEmpresa}
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

        {casoCreado && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center animate-fade-in">
            <p className="text-green-800 font-semibold mb-1">Caso creado exitosamente</p>
            <p className="text-green-600 text-sm mb-2">
              Número de seguimiento: <strong>{casoCreado.numeroCaso}</strong>
            </p>
            <Link
              href={`/agente/${casoCreado.id}`}
              className="inline-block text-xs text-white px-4 py-1.5 rounded-full transition-colors"
              style={{ backgroundColor: colorPrimario }}
            >
              Ver caso en consola del agente →
            </Link>
          </div>
        )}

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
