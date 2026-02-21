"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Agente {
  id: string;
  nombre: string;
  equipo: string;
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
  agente: Agente | null;
  _count: { interacciones: number };
}

const CANAL_ICONS: Record<string, string> = {
  whatsapp: "💬",
  sms: "📱",
  web: "🌐",
  facebook: "📘",
  instagram: "📸",
  voz: "📞",
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

function SLABadge({ sla, completedAt }: { sla: string | null; completedAt: string | null }) {
  if (!sla) return null;
  const deadline = new Date(sla);
  const now = completedAt ? new Date(completedAt) : new Date();
  const minutesLeft = (deadline.getTime() - now.getTime()) / (1000 * 60);

  let className = "sla-a-tiempo";
  let label = "A tiempo";
  if (minutesLeft < 0) {
    className = "sla-vencido";
    label = "Vencido";
  } else if (minutesLeft < 30) {
    className = "sla-en-riesgo";
    label = `${Math.round(minutesLeft)}m`;
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function AgentePage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("");
  const [filtroCanal, setFiltroCanal] = useState<string>("");
  const [page, setPage] = useState(1);
  const [vistaKanban, setVistaKanban] = useState(false);

  const cargarCasos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado", filtroEstado);
    if (filtroPrioridad) params.set("prioridad", filtroPrioridad);
    if (filtroCanal) params.set("canal", filtroCanal);
    params.set("page", String(page));
    params.set("limit", "50");

    const res = await fetch(`/api/casos?${params}`);
    const data = await res.json();
    setCasos(data.casos);
    setTotal(data.total);
    setLoading(false);
  }, [filtroEstado, filtroPrioridad, filtroCanal, page]);

  useEffect(() => {
    cargarCasos();
  }, [cargarCasos]);

  // SSE for real-time updates
  useEffect(() => {
    const evtSource = new EventSource("/api/sse");
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update") {
        cargarCasos();
      }
    };
    return () => evtSource.close();
  }, [cargarCasos]);

  const kanbanStates = ["nuevo", "asignado", "en_curso", "escalado", "resuelto"];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              ← Inicio
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-gray-900">Consola del Agente</h1>
            <span className="text-sm text-gray-500">({total} casos)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVistaKanban(false)}
              className={`px-3 py-1 text-sm rounded ${!vistaKanban ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Lista
            </button>
            <button
              onClick={() => setVistaKanban(true)}
              className={`px-3 py-1 text-sm rounded ${vistaKanban ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Kanban
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          <span className="text-sm text-gray-500 font-medium">Filtros:</span>
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Todos los estados</option>
            {["nuevo", "asignado", "en_curso", "escalado", "resuelto", "cerrado"].map((e) => (
              <option key={e} value={e}>{e.replace("_", " ")}</option>
            ))}
          </select>
          <select
            value={filtroPrioridad}
            onChange={(e) => { setFiltroPrioridad(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Todas las prioridades</option>
            {["alta", "media", "baja"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filtroCanal}
            onChange={(e) => { setFiltroCanal(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Todos los canales</option>
            {["whatsapp", "sms", "web", "facebook", "instagram", "voz"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => { setFiltroEstado(""); setFiltroPrioridad(""); setFiltroCanal(""); setPage(1); }}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : vistaKanban ? (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanStates.map((estado) => {
              const casosFiltrados = casos.filter((c) => c.estado === estado);
              return (
                <div key={estado} className="min-w-[260px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[estado]}`}>
                      {estado.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-500">({casosFiltrados.length})</span>
                  </div>
                  <div className="space-y-2">
                    {casosFiltrados.map((caso) => (
                      <Link
                        key={caso.id}
                        href={`/agente/${caso.id}`}
                        className="block bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-mono text-gray-500">{caso.numeroCaso}</span>
                          <span>{CANAL_ICONS[caso.canalOrigen] || "?"}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{caso.clienteNombre}</p>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{caso.categoria}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORIDAD_COLORS[caso.prioridad]}`}>
                            {caso.prioridad}
                          </span>
                          <SLABadge sla={caso.slaResolucion} completedAt={null} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Caso</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Cliente</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Canal</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Prioridad</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">SLA</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Agente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {casos.map((caso) => (
                    <tr key={caso.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/agente/${caso.id}`} className="text-blue-600 hover:text-blue-700 font-mono text-xs">
                          {caso.numeroCaso}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{caso.clienteNombre}</td>
                      <td className="px-4 py-3">
                        <span title={caso.canalOrigen}>{CANAL_ICONS[caso.canalOrigen] || "?"} {caso.canalOrigen}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{caso.categoria}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[caso.estado]}`}>
                          {caso.estado.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORIDAD_COLORS[caso.prioridad]}`}>
                          {caso.prioridad}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SLABadge sla={caso.slaResolucion} completedAt={null} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {caso.agente?.nombre || <span className="text-gray-400">Sin asignar</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Mostrando {Math.min((page - 1) * 50 + 1, total)}-{Math.min(page * 50, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 50 >= total}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
