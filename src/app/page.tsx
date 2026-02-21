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
                    <p className="text-sm font-semibold text-gray-700">Cambiar perfil de negocio</p>
                    <p className="text-xs text-gray-500">Configura la plataforma para otra empresa</p>
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

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{ backgroundColor: c.primario + "15", color: c.primario }}
          >
            {perfil.industria}
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {perfil.nombre}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {perfil.descripcion} Journey completo: desde que el cliente inicia una
            conversaci&oacute;n hasta que su caso se resuelve, se cierra y se mide.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          <Link
            href="/cliente"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-opacity-50"
            style={{ ["--hover-border" as string]: c.primario }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: c.primario + "15" }}
            >
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Simulador de Cliente
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Experimenta el journey del cliente de {perfil.nombreCorto}. Elige un canal, conversa
              con el bot inteligente y observa c&oacute;mo se crea un caso autom&aacute;ticamente.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {perfil.canalesHabilitados.map((canal) => (
                <span key={canal} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {CANAL_ICONS[canal]?.icon} {CANAL_ICONS[canal]?.nombre || canal}
                </span>
              ))}
            </div>
          </Link>

          <Link
            href="/agente"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: c.secundario + "15" }}
            >
              <span className="text-3xl">🎧</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Consola del Agente
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Gestiona casos de {perfil.nombreCorto} desde una sola interfaz. Filtra por estado,
              prioridad y SLA. Responde al cliente sin importar el canal de origen.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Bandeja", "Timeline", "SLA", "Responder", "Escalar"].map((c) => (
                <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {c}
                </span>
              ))}
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: c.acento + "15" }}
            >
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Dashboard Operacional
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Visibilidad total para supervisores de {perfil.nombreCorto}. M&eacute;tricas en tiempo real,
              compliance de SLAs, carga por agente y alertas operacionales.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["KPIs", "SLA %", "CSAT", "Tendencias", "Alertas"].map((c) => (
                <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {c}
                </span>
              ))}
            </div>
          </Link>
        </div>

        {/* Journey Arrow */}
        <div className="mt-12 flex items-center gap-3 text-sm text-gray-500 flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full" style={{ backgroundColor: c.primario + "15", color: c.primario }}>1. Descubrimiento</span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full" style={{ backgroundColor: c.secundario + "15", color: c.secundario }}>2. Conversaci&oacute;n</span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full" style={{ backgroundColor: c.primario + "25", color: c.primario }}>3. Caso</span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full" style={{ backgroundColor: c.secundario + "25", color: c.secundario }}>4. Ejecuci&oacute;n</span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full" style={{ backgroundColor: c.acento + "20", color: c.acento }}>5. Cierre</span>
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
