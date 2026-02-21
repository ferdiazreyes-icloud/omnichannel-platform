"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Caso {
  id: string;
  numeroCaso: string;
  canalOrigen: string;
  clienteNombre: string;
  categoria: string;
  prioridad: string;
  estado: string;
  slaResolucion: string | null;
  agente: { nombre: string } | null;
  createdAt: string;
}

const CANAL_ICONS: Record<string, string> = {
  whatsapp: "💬", sms: "📱", web: "🌐", facebook: "📘", instagram: "📸", voz: "📞",
};

interface AlertaAgente {
  nombre: string;
  activos: number;
}

export default function AlertasPage() {
  const [casosVencidos, setCasosVencidos] = useState<Caso[]>([]);
  const [casosEnRiesgo, setCasosEnRiesgo] = useState<Caso[]>([]);
  const [agentesSobrecargados, setAgentesSobrecargados] = useState<AlertaAgente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlertas = async () => {
      const res = await fetch("/api/casos?limit=200");
      const data = await res.json();
      const now = new Date();

      const vencidos: Caso[] = [];
      const enRiesgo: Caso[] = [];
      const agenteCarga: Record<string, { nombre: string; activos: number }> = {};

      for (const caso of data.casos) {
        if (["resuelto", "cerrado"].includes(caso.estado)) continue;

        // Agent load
        if (caso.agente) {
          if (!agenteCarga[caso.agente.nombre]) {
            agenteCarga[caso.agente.nombre] = { nombre: caso.agente.nombre, activos: 0 };
          }
          agenteCarga[caso.agente.nombre].activos++;
        }

        if (!caso.slaResolucion) continue;
        const deadline = new Date(caso.slaResolucion);
        const minutesLeft = (deadline.getTime() - now.getTime()) / (1000 * 60);

        if (minutesLeft < 0) {
          vencidos.push(caso);
        } else if (minutesLeft < 60) {
          enRiesgo.push(caso);
        }
      }

      setCasosVencidos(vencidos);
      setCasosEnRiesgo(enRiesgo);
      setAgentesSobrecargados(
        Object.values(agenteCarga).filter((a) => a.activos >= 12)
      );
      setLoading(false);
    };

    fetchAlertas();
    const interval = setInterval(fetchAlertas, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            ← Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-semibold text-gray-900">Centro de Alertas</h1>
          <div className="flex items-center gap-1 ml-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">
              {casosVencidos.length + casosEnRiesgo.length + agentesSobrecargados.length} alertas activas
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 space-y-6">
        {/* SLA Vencidos */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h2 className="font-semibold text-red-700">SLAs Vencidos ({casosVencidos.length})</h2>
          </div>
          {casosVencidos.length === 0 ? (
            <p className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3">
              No hay SLAs vencidos actualmente.
            </p>
          ) : (
            <div className="space-y-2">
              {casosVencidos.map((caso) => {
                const deadline = new Date(caso.slaResolucion!);
                const overdue = Math.abs(Math.round((Date.now() - deadline.getTime()) / (1000 * 60)));
                return (
                  <Link
                    key={caso.id}
                    href={`/agente/${caso.id}`}
                    className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span>{CANAL_ICONS[caso.canalOrigen]}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {caso.numeroCaso} — {caso.clienteNombre}
                        </p>
                        <p className="text-xs text-gray-600">{caso.categoria}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">Vencido hace {overdue}m</p>
                      <p className="text-xs text-gray-500">{caso.agente?.nombre || "Sin asignar"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* SLA en Riesgo */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <h2 className="font-semibold text-yellow-700">SLAs en Riesgo ({casosEnRiesgo.length})</h2>
          </div>
          {casosEnRiesgo.length === 0 ? (
            <p className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3">
              No hay SLAs en riesgo actualmente.
            </p>
          ) : (
            <div className="space-y-2">
              {casosEnRiesgo.map((caso) => {
                const deadline = new Date(caso.slaResolucion!);
                const remaining = Math.round((deadline.getTime() - Date.now()) / (1000 * 60));
                return (
                  <Link
                    key={caso.id}
                    href={`/agente/${caso.id}`}
                    className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3 hover:bg-yellow-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span>{CANAL_ICONS[caso.canalOrigen]}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {caso.numeroCaso} — {caso.clienteNombre}
                        </p>
                        <p className="text-xs text-gray-600">{caso.categoria}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-yellow-600">{remaining}m restantes</p>
                      <p className="text-xs text-gray-500">{caso.agente?.nombre || "Sin asignar"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Agents overloaded */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <h2 className="font-semibold text-orange-700">
              Agentes Sobrecargados ({agentesSobrecargados.length})
            </h2>
          </div>
          {agentesSobrecargados.length === 0 ? (
            <p className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3">
              Todos los agentes están dentro de la capacidad normal.
            </p>
          ) : (
            <div className="space-y-2">
              {agentesSobrecargados.map((agente) => (
                <div
                  key={agente.nombre}
                  className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{agente.nombre}</p>
                    <p className="text-xs text-gray-600">Casos activos exceden el límite recomendado</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">{agente.activos}</p>
                    <p className="text-xs text-gray-500">casos activos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
