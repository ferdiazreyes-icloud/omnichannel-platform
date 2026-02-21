"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PerfilBasico {
  nombreCorto: string;
  logo: string;
  colores: { primario: string; secundario: string; acento: string; fondo: string };
}
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
  LineChart,
  Line,
  Treemap,
} from "recharts";

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
  conversionPorCanal: Record<string, { total: number; resueltos: number }>;
  tendenciaVolumen: Array<{ fecha: string; cantidad: number }>;
}

const CANAL_COLORS: Record<string, string> = {
  whatsapp: "#25D366",
  sms: "#5B5EA6",
  web: "#2563EB",
  facebook: "#1877F2",
  instagram: "#E4405F",
  voz: "#F59E0B",
};

const ESTADO_COLORS: Record<string, string> = {
  nuevo: "#3B82F6",
  asignado: "#06B6D4",
  en_curso: "#F59E0B",
  escalado: "#EF4444",
  resuelto: "#22C55E",
  cerrado: "#9CA3AF",
};

const PIE_COLORS = ["#3B82F6", "#06B6D4", "#F59E0B", "#EF4444", "#22C55E", "#9CA3AF"];

function KPICard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-gray-900"}`}>
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"operacion" | "negocio">("operacion");
  const [perfil, setPerfil] = useState<PerfilBasico | null>(null);

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((data) => setPerfil(data.perfil));
  }, []);

  useEffect(() => {
    const fetchMetricas = async () => {
      const res = await fetch("/api/metricas");
      const data = await res.json();
      setMetricas(data);
      setLoading(false);
    };
    fetchMetricas();

    // Auto-refresh every 10s
    const interval = setInterval(fetchMetricas, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metricas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { resumen } = metricas;

  const estadoData = Object.entries(metricas.porEstado).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    fill: ESTADO_COLORS[name] || "#9CA3AF",
  }));

  const canalData = Object.entries(metricas.porCanal).map(([name, value]) => ({
    name,
    value,
    fill: CANAL_COLORS[name] || "#9CA3AF",
  }));

  const intencionData = Object.entries(metricas.porIntencion).map(
    ([name, value], i) => ({
      name,
      value,
      size: value,
      fill: PIE_COLORS[i % PIE_COLORS.length],
    })
  );

  const conversionData = Object.entries(metricas.conversionPorCanal).map(
    ([canal, data]) => ({
      canal,
      tasa: data.total > 0 ? Math.round((data.resueltos / data.total) * 100) : 0,
      total: data.total,
      resueltos: data.resueltos,
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-medium text-sm" style={{ color: perfil?.colores.primario || "#2563EB" }}>
              ← Inicio
            </Link>
            <span className="text-gray-300">|</span>
            {perfil && (
              <div
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ backgroundColor: perfil.colores.primario }}
              >
                <span className="text-white font-bold text-xs">{perfil.logo.charAt(0)}</span>
              </div>
            )}
            <h1 className="text-lg font-semibold text-gray-900">Dashboard del Supervisor &mdash; {perfil?.nombreCorto || ""}</h1>
            <div className="flex items-center gap-1 ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Actualización en tiempo real</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/alertas"
              className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 font-medium"
            >
              Alertas ({resumen.casosVencidosSLA + resumen.casosEnRiesgoSLA})
            </Link>
            <button
              onClick={() => setTab("operacion")}
              className={`px-3 py-1 text-sm rounded ${tab === "operacion" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Operación
            </button>
            <button
              onClick={() => setTab("negocio")}
              className={`px-3 py-1 text-sm rounded ${tab === "negocio" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Negocio
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {tab === "operacion" ? (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard label="Casos activos" value={resumen.casosActivos} color="text-blue-600" />
              <KPICard
                label="SLA Respuesta"
                value={`${resumen.slaRespuestaCompliance}%`}
                color={resumen.slaRespuestaCompliance >= 80 ? "text-green-600" : "text-red-600"}
              />
              <KPICard
                label="Tiempo prom. respuesta"
                value={resumen.tiempoPromedioPrimeraRespuesta}
                suffix="min"
              />
              <KPICard
                label="SLA en riesgo / vencidos"
                value={`${resumen.casosEnRiesgoSLA} / ${resumen.casosVencidosSLA}`}
                color="text-red-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cases by State */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Casos por Estado</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={estadoData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {estadoData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Cases by Channel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Casos por Canal</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={canalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Casos">
                      {canalData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Agent Load */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Carga por Agente</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metricas.porAgente} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="activos" name="Casos activos" fill="#3B82F6" />
                  <Bar dataKey="total" name="Total (30 días)" fill="#93C5FD" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Volume Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Tendencia de Volumen (30 días)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metricas.tendenciaVolumen}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    name="Casos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* Business Dashboard */
          <div className="space-y-4">
            {/* Business KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard label="Total casos (30d)" value={resumen.totalCasos} />
              <KPICard
                label="SLA Resolución"
                value={`${resumen.slaResolucionCompliance}%`}
                color={resumen.slaResolucionCompliance >= 80 ? "text-green-600" : "text-red-600"}
              />
              <KPICard
                label="Tiempo prom. resolución"
                value={resumen.tiempoPromedioResolucion}
                suffix="hrs"
              />
              <KPICard
                label="CSAT promedio"
                value={resumen.csatPromedio}
                suffix="/5"
                color={resumen.csatPromedio >= 4 ? "text-green-600" : "text-yellow-600"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conversion by Channel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Tasa de Resolución por Canal</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="canal" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="tasa" name="Tasa resolución (%)">
                      {conversionData.map((entry, i) => (
                        <Cell key={i} fill={CANAL_COLORS[entry.canal] || "#9CA3AF"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Reasons - Treemap */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Motivos de Contacto</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <Treemap
                    data={intencionData}
                    dataKey="size"
                    nameKey="name"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={({ x, y, width, height, name, value }: { x: number; y: number; width: number; height: number; name: string; value: number }) => (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={
                            name === "venta"
                              ? "#3B82F6"
                              : name === "soporte"
                              ? "#F59E0B"
                              : name === "cobranza"
                              ? "#EF4444"
                              : "#22C55E"
                          }
                          rx={4}
                        />
                        {width > 50 && height > 30 && (
                          <>
                            <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                              {name}
                            </text>
                            <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="#fff" fontSize={11}>
                              {value}
                            </text>
                          </>
                        )}
                      </g>
                    )}
                  />
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cases by Priority */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Distribución por Prioridad</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(metricas.porPrioridad).map(([prioridad, count]) => {
                  const pct = Math.round((count / resumen.totalCasos) * 100);
                  const colors: Record<string, { bg: string; bar: string; text: string }> = {
                    alta: { bg: "bg-red-50", bar: "bg-red-500", text: "text-red-700" },
                    media: { bg: "bg-yellow-50", bar: "bg-yellow-500", text: "text-yellow-700" },
                    baja: { bg: "bg-green-50", bar: "bg-green-500", text: "text-green-700" },
                  };
                  const c = colors[prioridad] || colors.media;
                  return (
                    <div key={prioridad} className={`${c.bg} rounded-lg p-4`}>
                      <p className={`text-sm font-medium ${c.text} capitalize`}>{prioridad}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className={`${c.bar} rounded-full h-2 transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{pct}% del total</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
