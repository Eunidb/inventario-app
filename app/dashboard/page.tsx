"use client";

import React, { useEffect, useState } from "react";
import { Package, ArrowLeftRight, AlertTriangle, TrendingUp, Plus, Clock, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/sidebar";
import StatsCard from "@/components/StatsCard";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({ 
    totalStock: 0, 
    prestamosActivos: 0, 
    articulosCriticos: 0, 
    movimientos: 0 
  });

  interface RecentActivity {
  id: number;
  tipo_movimiento: string;
  cantidad: number;
  fecha: string;
  inventario: {
    nombre: string;
  };
}
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      // 1. Obtener conteos básicos
      const { count: stockCount } = await supabase.from('inventario').select('*', { count: 'exact', head: true });
      const { count: prestamosCount } = await supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'activo');
      const { count: criticalCount } = await supabase.from('inventario').select('*', { count: 'exact', head: true }).lt('stock_disponible', 'stock_minimo');
      
      // 2. Obtener actividad reciente (Join con inventario)
      const { data: history } = await supabase
        .from('historial_inventario')
        .select(`id, tipo_movimiento, cantidad, fecha, inventario(nombre)`)
        .order('fecha', { ascending: false })
        .limit(5);

      setMetrics({
        totalStock: stockCount || 0,
        prestamosActivos: prestamosCount || 0,
        articulosCriticos: criticalCount || 0,
        movimientos: history?.length || 0
      });
   const { data, error } = await supabase
    .from('historial_inventario')
    .select(`
      id, 
      tipo_movimiento, 
      cantidad, 
      fecha, 
      inventario (nombre)
    `)
    .order('fecha', { ascending: false })
    .limit(5);

  if (data) {
    // Forzamos el tipado aquí para que coincida con la interfaz
    setRecentActivity(data as unknown as RecentActivity[]);
  }
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 w-full lg:ml-64 transition-all duration-300">
        <div className="p-4 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h1>
              <p className="text-slate-500 text-sm font-medium">Bienvenido al sistema de gestión de inventarios.</p>
            </div>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-blue-100">
              <Plus size={18} />
              <span>Nuevo Movimiento</span>
            </button>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Productos" count={metrics.totalStock} icon={<Package className="text-blue-600"/>} color="bg-blue-50" />
            <StatsCard title="Préstamos Activos" count={metrics.prestamosActivos} icon={<ArrowLeftRight className="text-indigo-600"/>} color="bg-indigo-50" />
            <StatsCard title="Stock Crítico" count={metrics.articulosCriticos} icon={<AlertTriangle className="text-amber-600"/>} color="bg-amber-50" />
            <StatsCard title="Movimientos Hoy" count={metrics.movimientos} icon={<TrendingUp className="text-emerald-600"/>} color="bg-emerald-50" />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Actividad Reciente */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Actividad Reciente</h3>
                <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                  Ver todo <ChevronRight size={14} />
                </button>
              </div>
              
              <div className="space-y-3">
                {recentActivity.map((act: any) => (
                  <div key={act.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{act.inventario?.nombre}</p>
                        <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">{act.tipo_movimiento} • {act.cantidad} unidades</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(act.fecha).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración Rápida / Status */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado del Servidor</span>
                </div>
                <p className="text-xl font-bold mb-1">Base de Datos Lista</p>
                <p className="text-slate-400 text-xs">Sincronizado con Supabase Cloud</p>
              </div>

              <div className="bg-blue-600 rounded-3xl p-6 text-white">
                <p className="text-sm font-medium opacity-90 mb-4">¿Necesitas generar un reporte de inventario?</p>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold text-xs transition-colors">
                  Ir a Reportes
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}