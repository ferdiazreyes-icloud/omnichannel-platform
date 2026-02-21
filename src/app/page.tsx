"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PerfilResumen {
  id: string;
  nombre: string;
  nombreCorto: string;
  industria: string;
  logo: string;
  colores: {
    primario: string;
    secundario: string;
    acento: string;
    fondo: string;
  };
}

interface PerfilCompleto extends PerfilResumen {
  descripcion: string;
  canalesHabilitados: string[];
}

interface PerfilResponse {
  activo: string;
  perfil: PerfilCompleto;
  disponibles: PerfilResumen[];
}

const CANAL_ICONS: Record<string, { icon: string; nombre: string }> = {
  whatsapp: { icon: "💬", nombre: "WhatsApp" },
  sms: { icon: "📱", nombre: "SMS" },
  web: { icon: "🌐", nombre: "Web Chat" },
  facebook: { icon: "📘", nombre: "Facebook" },
  instagram: { icon: "📸", nombre: "Instagram" },
  voz: { icon: "📞", nombre: "Voz" },
};

export default function HomePage() {
  const [data, setData] = useState<PerfilResponse | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const cambiarPerfil = async (perfilId: string) => {
    setSwitching(true);
    const res = await fetch("/api/perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perfilId }),
    });
    const newData = await res.json();
    setData(newData);
    setSelectorOpen(false);
    setSwitching(false);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { perfil, disponibles, activo } = data;
  const c = perfil.colores;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: c.fondo }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: c.primario }}
            >
              <span className="text-white font-bold text-sm">{perfil.logo}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{perfil.nombreCorto}</h1>
              <p className="text-xs text-gray-500">Customer Operations Omnicanal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Profile Selector */}
            <div className="relative">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: c.primario }}
                >
                  <span className="text-white text-xs font-bold">{perfil.logo.charAt(0)}</span>
                </div>
                <span className="text-gray-700 font-medium hidden sm:inline">{perfil.nombreCorto}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {selectorOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">Demos por industria</p>
                    <p className="text-xs text-gray-500">Selecciona una empresa ejemplo para explorar la plataforma</p>
                  </div>
                  <div className="p-2 max-h-80 overflow-y-auto">
                    {disponibles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => cambiarPerfil(p.id)}
                        disabled={switching}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          p.id === activo
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: p.colores.primario }}
                        >
                          <span className="text-white font-bold text-xs">{p.logo}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                          <p className="text-xs text-gray-500">{p.industria}</p>
                        </div>
                        {p.id === activo && (
                          <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            Activo
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: c.acento + "20", color: c.acento }}>
              DEMO
            </span>
          </div>
        </div>
      </header>

      {/* Click outside to close */}
      {selectorOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSelectorOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-10">
        {/* Intro */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-3"
            style={{ backgroundColor: c.primario + "15", color: c.primario }}
          >
            {perfil.industria}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{perfil.nombre}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {perfil.descripcion}
          </p>
        </div>

        {/* ═══ Command Center Hero Card ═══ */}
        <Link
          href="/demo"
          className="group w-full max-w-5xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-opacity-60 mb-8"
          style={{ borderColor: c.primario + "40" }}
        >
          {/* Dark preview bar */}
          <div className="bg-gray-900 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-800 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🖥️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Vista Integrada &mdash; Flujo End-to-End</h3>
                <p className="text-sm text-gray-400">
                  Visualiza c&oacute;mo interact&uacute;an cliente, agente y dashboard en una sola pantalla
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Solo para fines demostrativos &mdash; en producci&oacute;n cada rol tiene su propia interfaz
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">En vivo</span>
              </div>
              <span
                className="text-sm font-semibold text-white px-5 py-2 rounded-lg group-hover:brightness-110 transition-all"
                style={{ backgroundColor: c.primario }}
              >
                Abrir →
              </span>
            </div>
          </div>
          {/* Layout preview */}
          <div className="bg-gray-800 px-6 py-4 flex gap-3 h-[180px]">
            {/* Mini chat preview */}
            <div className="w-1/4 bg-gray-700/60 rounded-lg p-3 flex flex-col gap-2 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">💬</span>
                <span className="text-[10px] font-semibold text-gray-300">Cliente</span>
              </div>
              <div className="flex justify-end"><div className="bg-blue-500/40 rounded-xl rounded-br-sm h-4 w-3/4" /></div>
              <div className="flex justify-start"><div className="bg-gray-600 rounded-xl rounded-bl-sm h-6 w-4/5" /></div>
              <div className="flex justify-end"><div className="bg-blue-500/40 rounded-xl rounded-br-sm h-4 w-2/3" /></div>
              <div className="flex justify-start"><div className="bg-gray-600 rounded-xl rounded-bl-sm h-8 w-full" /></div>
            </div>
            {/* Mini agent preview */}
            <div className="flex-1 bg-gray-700/60 rounded-lg p-3 flex flex-col gap-1.5 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">🎧</span>
                <span className="text-[10px] font-semibold text-gray-300">Consola del Agente</span>
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-600/50 rounded px-2 py-1.5">
                  <div className="w-4 h-4 rounded-full bg-gray-500/50" />
                  <div className="flex-1 h-2 bg-gray-500/40 rounded" />
                  <div className="w-10 h-3 rounded-full bg-blue-500/30" />
                  <div className="w-8 h-3 rounded-full bg-yellow-500/30" />
                </div>
              ))}
            </div>
            {/* Mini activity feed */}
            <div className="w-1/5 bg-gray-700/60 rounded-lg p-3 flex flex-col gap-1.5 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">⚡</span>
                <span className="text-[10px] font-semibold text-gray-300">Actividad</span>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-500/40 flex-shrink-0" />
                  <div className="flex-1 h-2 bg-gray-500/30 rounded" />
                </div>
              ))}
            </div>
          </div>
          {/* Dashboard strip */}
          <div className="bg-gray-850 px-6 py-3 flex items-center gap-4" style={{ backgroundColor: "#1a1f2e" }}>
            <span className="text-xs">📊</span>
            <span className="text-[10px] font-semibold text-gray-400">Dashboard</span>
            <div className="flex gap-2 ml-2">
              {["Activos", "SLA", "Riesgo", "CSAT"].map((kpi) => (
                <div key={kpi} className="bg-gray-700/50 rounded px-2 py-1">
                  <span className="text-[9px] text-gray-500 uppercase">{kpi}</span>
                </div>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-2 rounded-sm bg-blue-500/30" /> Estado
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-2 rounded-sm bg-green-500/30" /> Canal
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-2 rounded-sm bg-yellow-500/30" /> Agentes
              </span>
            </div>
          </div>
        </Link>

        {/* ═══ Individual views (compact) ═══ */}
        <div className="w-full max-w-5xl">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 px-1">
            Interfaces de Producci&oacute;n &mdash; por Rol
          </p>
          <p className="text-[11px] text-gray-400 mb-3 px-1">
            As&iacute; se ver&iacute;a la plataforma para cada tipo de usuario
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/cliente"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 flex items-start gap-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: c.primario + "15" }}
              >
                <span className="text-xl">💬</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-gray-900">Portal del Cliente</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: c.primario + "15", color: c.primario }}>Vista: Cliente</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  La experiencia del cliente final: elige un canal, conversa con el bot y crea un caso.
                </p>
                <div className="flex flex-wrap gap-1">
                  {perfil.canalesHabilitados.slice(0, 4).map((canal) => (
                    <span key={canal} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {CANAL_ICONS[canal]?.icon} {CANAL_ICONS[canal]?.nombre || canal}
                    </span>
                  ))}
                  {perfil.canalesHabilitados.length > 4 && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      +{perfil.canalesHabilitados.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            <Link
              href="/agente"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 flex items-start gap-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: c.secundario + "15" }}
              >
                <span className="text-xl">🎧</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-gray-900">Consola del Agente</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: c.secundario + "15", color: c.secundario }}>Vista: Agente</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  Bandeja unificada con SLAs, filtros, vista Kanban y respuesta omnicanal.
                </p>
                <div className="flex flex-wrap gap-1">
                  {["Bandeja", "Timeline", "SLA", "Escalar"].map((t) => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 flex items-start gap-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: c.acento + "15" }}
              >
                <span className="text-xl">📊</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-gray-900">Dashboard del Supervisor</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: c.acento + "15", color: c.acento }}>Vista: Supervisor</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  KPIs en tiempo real, compliance de SLAs, carga por agente y alertas.
                </p>
                <div className="flex flex-wrap gap-1">
                  {["KPIs", "SLA %", "CSAT", "Alertas"].map((t) => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          </div>

          {/* Voice Agent Spike */}
          <div className="mt-6">
            <Link
              href="/voz"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 flex items-start gap-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: "#F59E0B15" }}
              >
                <span className="text-xl">📞</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-gray-900">Asistente de Voz</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600">Spike</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Conversa con el asistente virtual por voz en tiempo real. OpenAI Realtime API + WebRTC.
                </p>
                <div className="flex flex-wrap gap-1">
                  {["WebRTC", "Realtime", "Voz a Voz", "Sub-300ms"].map((t) => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          Arena Analytics — Plataforma de Customer Operations Omnicanal para {perfil.nombre}
        </div>
      </footer>
    </div>
  );
}
