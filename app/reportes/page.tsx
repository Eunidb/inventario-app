"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import { 
  Calendar, Filter, Loader2, BarChart2, 
  Package, AlertTriangle, Download, RefreshCw, TrendingUp 
} from "lucide-react";

// Importación dinámica de los botones de Excel para evitar errores de SSR/Turbopack
const ComponentesExportacion = dynamic(() => import("@/components/ComponentesExportacion"), { 
  ssr: false,
  loading: () => <div className="h-20 animate-pulse bg-slate-100 rounded-xl w-full" />
});

// Tipado para TypeScript
interface ReportData {
  inventario: any[];
  movimientos: any[];
  prestamos: any[];
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  
  // Estadísticas para las gráficas/tarjetas
  const [stats, setStats] = useState({
    totalArticulos: 0,
    valorTotalUnidades: 0,
    stockBajo: 0,
    prestamosActivos: 0,
    dadosBaja: 0,
  });

  const [data, setData] = useState<ReportData>({
    inventario: [],
    movimientos: [],
    prestamos: []
  });

  const fetchReportData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Cargar Inventario y calcular estadísticas base
      const { data: inv } = await supabase
        .from("inventario")
        .select("*, categorias(nombre)");

      const { count: prestamosCount } = await supabase
        .from("prestamos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "activo");

      const { count: bajasCount } = await supabase
        .from("inventario")
        .select("*", { count: "exact", head: true })
        .eq("estado", "dado_de_baja");

      // Filtrar stock bajo localmente para las estadísticas
      const bajoStock = (inv ?? []).filter(i => 
        i.estado === "activo" && Number(i.stock_disponible) <= Number(i.stock_minimo)
      );

      setStats({
        totalArticulos: inv?.length || 0,
        valorTotalUnidades: (inv ?? []).reduce((a, i) => a + Number(i.stock_disponible), 0),
        stockBajo: bajoStock.length,
        prestamosActivos: prestamosCount ?? 0,
        dadosBaja: bajasCount ?? 0,
      });

      // 2. Cargar Movimientos filtrados por fecha
      let qMov = supabase.from("historial_inventario").select("*, inventario(nombre), usuarios(nombre_completo)");
      if (fechaDesde) qMov = qMov.gte("fecha", fechaDesde);
      if (fechaHasta) qMov = qMov.lte("fecha", fechaHasta + "T23:59:59");
      const { data: mov } = await qMov;

      // 3. Cargar Préstamos filtrados por fecha
      let qPre = supabase.from("prestamos").select("*, usuarios(nombre_completo)");
      if (fechaDesde) qPre = qPre.gte("fecha_salida", fechaDesde);
      if (fechaHasta) qPre = qPre.lte("fecha_salida", fechaHasta + "T23:59:59");
      const { data: pre } = await qPre;

      setData({ 
        inventario: inv || [], 
        movimientos: mov || [], 
        prestamos: pre || [] 
      });

    } catch (error) {
      console.error("Error en reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [fechaDesde, fechaHasta]);

  const StatCard = ({ title, value, color, Icon, sub }: any) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <p className={`text-2xl font-black mt-2 ${color}`}>{loading ? "..." : value}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-1 font-bold">{sub}</p>}
        </div>
        <div className="p-3 rounded-xl bg-slate-50 text-slate-400">
          <Icon size={18} className={color} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Reportes</h1>
            <p className="text-slate-500 font-medium">Análisis visual y exportación de datos maestros</p>
          </div>

          {/* ── Grid de Estadísticas (Tus Gráficas/Tarjetas) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard title="Total Artículos" value={stats.totalArticulos} color="text-slate-800" Icon={Package} />
            <StatCard title="Unidades Totales" value={stats.valorTotalUnidades} color="text-blue-600" Icon={BarChart2} />
            <StatCard title="Stock Bajo" value={stats.stockBajo} color="text-amber-600" Icon={AlertTriangle} sub="Critico" />
            <StatCard title="Préstamos" value={stats.prestamosActivos} color="text-emerald-600" Icon={RefreshCw} />
            <StatCard title="Dados de Baja" value={stats.dadosBaja} color="text-red-500" Icon={TrendingUp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Filtros y Exportación */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Filtros de Fecha */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold">
                  <Calendar size={18} className="text-blue-500" />
                  <h2>Periodo de Auditoría</h2>
                </div>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Desde</label>
                    <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Hasta</label>
                    <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <button onClick={fetchReportData} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                    Filtrar
                  </button>
                </div>
              </div>

              {/* Centro de Descargas Excel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold">
                  <Download size={18} className="text-emerald-500" />
                  <h2>Descargar Reportes XLSX</h2>
                </div>
                <ComponentesExportacion 
                  dataInventario={data.inventario}
                  dataMovimientos={data.movimientos}
                  dataPrestamos={data.prestamos}
                  rangoFechas={{ desde: fechaDesde, hasta: fechaHasta }}
                />
              </div>

            </div>

            {/* Columna Derecha: Resumen Rápido o Info */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl h-full">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-400" />
                  Estado del Sistema
                </h3>
                <div className="space-y-6 mt-8">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400 uppercase font-black">Eficiencia Stock</span>
                      <span className="font-bold text-emerald-400">92%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[92%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400 uppercase font-black">Artículos Críticos</span>
                      <span className="font-bold text-amber-400">{stats.stockBajo}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[40%]" />
                    </div>
                  </div>
                </div>
                <p className="mt-12 text-[11px] text-slate-400 leading-relaxed font-medium italic">
                  * Los reportes de movimientos y préstamos se generan en base al rango de fechas seleccionado arriba. El inventario siempre se exporta en su estado actual.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}