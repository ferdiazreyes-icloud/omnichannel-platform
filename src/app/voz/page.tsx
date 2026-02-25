"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWebRTC, type ConnectionState } from "@/hooks/use-webrtc";
import Link from "next/link";

interface PerfilData {
  activo: string;
  perfil: {
    nombre: string;
    nombreCorto: string;
    logo: string;
    colores: { primario: string; secundario: string; acento: string; fondo: string };
  };
}

function StatusBadge({ state }: { state: ConnectionState }) {
  const config: Record<ConnectionState, { label: string; color: string; bg: string }> = {
    disconnected: { label: "Disponible", color: "text-gray-500", bg: "bg-gray-100" },
    connecting: { label: "Conectando...", color: "text-amber-600", bg: "bg-amber-50" },
    connected: { label: "En llamada", color: "text-green-600", bg: "bg-green-50" },
    error: { label: "Error", color: "text-red-600", bg: "bg-red-50" },
  };
  const c = config[state];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${c.color} ${c.bg}`}>
      {state === "connected" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
      {state === "connecting" && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
      {c.label}
    </span>
  );
}

function PulseRing({ active, speaking, color }: { active: boolean; speaking: boolean; color: string }) {
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      {active && (
        <>
          <span
            className={`absolute inset-0 rounded-full opacity-10 ${speaking ? "animate-ping" : ""}`}
            style={{ backgroundColor: color, animationDuration: "1.5s" }}
          />
          <span
            className={`absolute inset-3 rounded-full opacity-15 ${speaking ? "animate-ping" : ""}`}
            style={{ backgroundColor: color, animationDuration: "2s" }}
          />
          <span
            className="absolute inset-6 rounded-full opacity-20"
            style={{ backgroundColor: color }}
          />
        </>
      )}
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300"
        style={{ backgroundColor: active ? color : "#e5e7eb" }}
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {active ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          )}
        </svg>
      </div>
    </div>
  );
}

function CallTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="text-xs font-mono text-gray-500">
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export default function VozPage() {
  const { state, error, transcript, isAssistantSpeaking, isSimulation, connect, disconnect } = useWebRTC();
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [casoCreado, setCasoCreado] = useState<{ numeroCaso: string } | null>(null);
  const [creandoCaso, setCreandoCaso] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then(setPerfil);
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Track call start time
  useEffect(() => {
    if (state === "connected" && !callStartTime) {
      setCallStartTime(Date.now());
    }
    if (state === "disconnected") {
      setCallStartTime(null);
    }
  }, [state, callStartTime]);

  const c = perfil?.perfil.colores ?? {
    primario: "#003DA5",
    secundario: "#0066CC",
    acento: "#FF6B00",
    fondo: "#F0F5FF",
  };

  const handleToggle = () => {
    if (state === "connected" || state === "connecting") {
      disconnect();
    } else {
      setCasoCreado(null);
      connect();
    }
  };

  const crearCasoDesdeTranscript = useCallback(async () => {
    if (transcript.length === 0 || creandoCaso) return;
    setCreandoCaso(true);

    try {
      // Build a summary from the transcript
      const resumen = transcript
        .map((t) => `${t.role === "user" ? "Cliente" : "Asistente"}: ${t.text}`)
        .join("\n");

      // Extract client name from transcript (first user message)
      const firstUserMsg = transcript.find((t) => t.role === "user")?.text || "Cliente Voz";

      const casoRes = await fetch("/api/casos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canalOrigen: "voz",
          clienteNombre: firstUserMsg.substring(0, 50),
          clienteContacto: "Llamada de voz",
          intencion: "informacion",
          categoria: "Consulta por voz",
          prioridad: "media",
          resumen: resumen.substring(0, 500),
        }),
      });

      const caso = await casoRes.json();
      setCasoCreado(caso);

      // Route the case
      await fetch("/api/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ casoId: caso.id }),
      });
    } catch {
      // Silent fail — user can retry
    } finally {
      setCreandoCaso(false);
    }
  }, [transcript, creandoCaso]);

  const isActive = state === "connected";
  const callEnded = state === "disconnected" && transcript.length > 0 && !casoCreado;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: c.fondo }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {perfil && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: c.primario }}
              >
                <span className="text-white font-bold text-xs">{perfil.perfil.logo}</span>
              </div>
            )}
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                Asistente de Voz {perfil ? `— ${perfil.perfil.nombreCorto}` : ""}
              </h1>
              <p className="text-[11px] text-gray-400">Canal de atención por voz en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && callStartTime && <CallTimer startTime={callStartTime} />}
            <StatusBadge state={state} />
            {isSimulation && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600">
                SIMULACIÓN
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        {/* Pulse visualization */}
        <PulseRing active={isActive} speaking={isAssistantSpeaking} color={c.primario} />

        {/* Status text */}
        <div className="text-center">
          {state === "disconnected" && transcript.length === 0 && (
            <p className="text-sm text-gray-500">Presiona el boton para iniciar una llamada con el asistente virtual</p>
          )}
          {state === "disconnected" && transcript.length > 0 && !casoCreado && (
            <p className="text-sm text-gray-500">Llamada finalizada</p>
          )}
          {state === "connecting" && (
            <p className="text-sm text-amber-600">Estableciendo conexion...</p>
          )}
          {state === "connected" && !isAssistantSpeaking && (
            <p className="text-sm text-green-600">Escuchando... habla con el asistente</p>
          )}
          {state === "connected" && isAssistantSpeaking && (
            <p className="text-sm" style={{ color: c.primario }}>El asistente esta respondiendo...</p>
          )}
          {state === "error" && (
            <p className="text-sm text-red-600">{error || "Error de conexion"}</p>
          )}
          {casoCreado && (
            <p className="text-sm text-green-600">Caso {casoCreado.numeroCaso} creado</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            disabled={state === "connecting"}
            className={`px-8 py-3 rounded-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive ? "bg-red-500 hover:bg-red-600" : ""
            }`}
            style={!isActive ? { backgroundColor: c.primario } : undefined}
          >
            {state === "connecting" && "Conectando..."}
            {state === "disconnected" && (transcript.length > 0 ? "Nueva llamada" : "Iniciar llamada")}
            {state === "connected" && "Terminar llamada"}
            {state === "error" && "Reintentar"}
          </button>

          {callEnded && (
            <button
              onClick={crearCasoDesdeTranscript}
              disabled={creandoCaso}
              className="px-6 py-3 rounded-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: c.acento }}
            >
              {creandoCaso ? "Creando..." : "Crear caso"}
            </button>
          )}
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="w-full max-w-xl mt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Transcripcion
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-h-64 overflow-y-auto p-4 space-y-3">
              {transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      entry.role === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                    style={entry.role === "user" ? { backgroundColor: c.primario } : undefined}
                  >
                    <span className="text-[10px] font-medium block mb-0.5 opacity-60">
                      {entry.role === "user" ? "Tu" : "Asistente"}
                    </span>
                    {entry.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3">
        <div className="max-w-3xl mx-auto px-4 text-center text-xs text-gray-400">
          Asistente de Voz — {perfil?.perfil.nombreCorto || "Arena"} &bull; Canal de atención omnicanal
        </div>
      </footer>
    </div>
  );
}
