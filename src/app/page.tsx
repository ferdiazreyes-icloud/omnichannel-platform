import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Arena</h1>
              <p className="text-xs text-gray-500">Customer Operations Omnicanal</p>
            </div>
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
            DEMO
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Plataforma de Customer Operations
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Journey completo: desde que el cliente inicia una conversación hasta que su caso
            se resuelve, se cierra y se mide. Todo trazable, con SLAs y dashboards operacionales.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          <Link
            href="/cliente"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200"
          >
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Simulador de Cliente
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Experimenta el journey del cliente. Elige un canal, conversa con el bot
              inteligente y observa cómo se crea un caso automáticamente.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["WhatsApp", "SMS", "Web", "Facebook", "Instagram", "Voz"].map((c) => (
                <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {c}
                </span>
              ))}
            </div>
          </Link>

          <Link
            href="/agente"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🎧</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Consola del Agente
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Gestiona casos desde una sola interfaz. Filtra por estado, prioridad y SLA.
              Responde al cliente sin importar el canal de origen.
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
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200"
          >
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Dashboard Operacional
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Visibilidad total para supervisores. Métricas en tiempo real,
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
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">1. Descubrimiento</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">2. Conversación</span>
          <span>→</span>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">3. Caso</span>
          <span>→</span>
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">4. Ejecución</span>
          <span>→</span>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full">5. Cierre</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          Arena Analytics — Demo de Plataforma de Customer Operations Omnicanal
        </div>
      </footer>
    </div>
  );
}
