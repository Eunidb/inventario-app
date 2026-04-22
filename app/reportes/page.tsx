/**
 * @file app/reportes/page.tsx
 * @description Reportes y estadísticas del inventario con gráficas.
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, Package, RefreshCw, AlertTriangle, Download, BarChart2 } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArticulos: 0,
    valorTotalUnidades: 0,
    stockBajo: 0,
    prestamosActivos: 0,
    dadosBaja: 0,
  });
  const [porCategoria, setPorCategoria]   = useState<any[]>([]);
  const [porEstado, setPorEstado]         = useState<any[]>([]);
  const [movimientosMes, setMovimientosMes] = useState<any[]>([]);
  const [topPrestados, setTopPrestados]   = useState<any[]>([]);
  const [stockBajoItems, setStockBajoItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();

      // Stats generales
      const [
        { count: total },
        { data: activos },
        { count: prestamosActivos },
        { count: dadosBaja },
      ] = await Promise.all([
        supabase.from("inventario").select("*", { count: "exact", head: true }),
        supabase.from("inventario").select("stock_disponible, stock_minimo, estado, categoria_id, categorias(nombre)"),
        supabase.from("prestamos").select("*", { count: "exact", head: true }).eq("estado", "activo"),
        supabase.from("inventario").select("*", { count: "exact", head: true }).eq("estado", "dado_de_baja"),
      ]);

      const stockBajoArr = (activos ?? []).filter(i => i.estado === "activo" && i.stock_disponible <= i.stock_minimo);

      setStats({
        totalArticulos: total ?? 0,
        valorTotalUnidades: (activos ?? []).reduce((a, i) => a + Number(i.stock_disponible), 0),
        stockBajo: stockBajoArr.length,
        prestamosActivos: prestamosActivos ?? 0,
        dadosBaja: dadosBaja ?? 0,
      });

      setStockBajoItems(stockBajoArr.slice(0, 8));

      // Por categoría
      const catMap: Record<string, number> = {};
      (activos ?? []).forEach(i => {
        const cat = (i.categorias as any)?.nombre ?? "Sin categoría";
        catMap[cat] = (catMap[cat] ?? 0) + 1;
      });
      setPorCategoria(Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

      // Por estado
      const estadoMap: Record<string, number> = {};
      (activos ?? []).forEach(i => { estadoMap[i.estado] = (estadoMap[i.estado] ?? 0) + 1; });
      const estadoLabels: Record<string, string> = {
        activo: "Activo", inactivo: "Inactivo", en_reparacion: "Reparación",
        mantenimiento: "Mantenimiento", dado_de_baja: "Baja"
      };
      setPorEstado(Object.entries(estadoMap).map(([k, v]) => ({ name: estadoLabels[k] ?? k, value: v })));

      // Movimientos últimos 7 días
      const hace7 = new Date();
      hace7.setDate(hace7.getDate() - 6);
      const { data: movData } = await supabase
        .from("historial_inventario")
        .select("tipo_movimiento, fecha, cantidad")
        .gte("fecha", hace7.toISOString());

      // Agrupar por día
      const dias: Record<string, { entradas: number; salidas: number }> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
        dias[key] = { entradas: 0, salidas: 0 };
      }
      (movData ?? []).forEach(m => {
        const key = new Date(m.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
        if (!dias[key]) return;
        if (["entrada", "devolucion"].includes(m.tipo_movimiento)) {
          dias[key].entradas += Number(m.cantidad);
        } else if (["salida", "prestamo", "baja"].includes(m.tipo_movimiento)) {
          dias[key].salidas += Number(m.cantidad);
        }
      });
      setMovimientosMes(Object.entries(dias).map(([name, v]) => ({ name, ...v })));

      // Top 5 más prestados
      const { data: detallePrestamo } = await supabase
        .from("detalle_prestamo")
        .select("cantidad, inventario(nombre)")
        .limit(200);

      const prestadoMap: Record<string, number> = {};
      (detallePrestamo ?? []).forEach((d: any) => {
        const n = d.inventario?.nombre ?? "—";
        prestadoMap[n] = (prestadoMap[n] ?? 0) + Number(d.cantidad);
      });
      setTopPrestados(
        Object.entries(prestadoMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value }))
      );

      setLoading(false);
    };
    load();
  }, []);

  const StatCard = ({ title, value, sub, color, Icon }: any) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className={`text-3xl font-black mt-2 ${color}`}>{loading ? "—" : value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-2xl bg-slate-50`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reportes</h1>
              <p className="text-slate-500 font-medium mt-1">Estadísticas y análisis del inventario</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard title="Total artículos" value={stats.totalArticulos} color="text-slate-800" Icon={Package} />
            <StatCard title="Unidades en stock" value={stats.valorTotalUnidades} color="text-blue-600" Icon={BarChart2} />
            <StatCard title="Stock bajo" value={stats.stockBajo} sub="Requieren atención" color="text-amber-600" Icon={AlertTriangle} />
            <StatCard title="Préstamos activos" value={stats.prestamosActivos} color="text-emerald-600" Icon={RefreshCw} />
            <StatCard title="Dados de baja" value={stats.dadosBaja} color="text-red-500" Icon={TrendingUp} />
          </div>

          {/* Gráficas Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Movimientos últimos 7 días */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5">Movimientos — Últimos 7 días</h2>
              {loading ? <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={movimientosMes} barSize={14}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                      cursor={{ fill: "#f1f5f9" }}
                    />
                    <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="salidas" name="Salidas" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Por estado */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5">Artículos por Estado</h2>
              {loading ? <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={porEstado} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" nameKey="name" paddingAngle={3}>
                      {porEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                    <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráficas Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Por categoría */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5">Artículos por Categoría</h2>
              {loading ? <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={porCategoria} layout="vertical" barSize={14}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="value" name="Artículos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top más prestados */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5">Top 5 Más Prestados</h2>
              {loading ? <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" /> :
                topPrestados.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sin datos de préstamos</div>
                ) : (
                  <div className="space-y-3">
                    {topPrestados.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                          <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${(item.value / topPrestados[0].value) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-black text-slate-700 flex-shrink-0">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          {/* Stock bajo */}
          {stockBajoItems.length > 0 && (
            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Artículos con Stock Bajo</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículo</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Disponible</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Mínimo</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nivel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stockBajoItems.map((item: any) => {
                      const pct = item.stock_minimo > 0 ? Math.min(100, (item.stock_disponible / item.stock_minimo) * 100) : 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 text-sm font-bold text-slate-800">{item.nombre}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="text-sm font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">{item.stock_disponible}</span>
                          </td>
                          <td className="px-6 py-3 text-center text-sm font-bold text-slate-400">{item.stock_minimo}</td>
                          <td className="px-6 py-3 w-40">
                            <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}