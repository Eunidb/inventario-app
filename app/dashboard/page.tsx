/**
 * @file app/dashboard/page.tsx
 * @description Dashboard optimizado, responsive y coherente con el Sidebar lateral.
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import StatsCard from "@/components/StatsCard";
import Link from "next/link";
import type { InventarioItem, HistorialMovimiento } from "@/lib/supabase";
import { 
  Box, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  TrendingUp, 
  Clock 
} from "lucide-react";

interface DashboardStats {
  totalArticulos: number;
  stockBajo: number;
  prestamosActivos: number;
  dadosBaja: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stockBajoItems, setStockBajoItems] = useState<InventarioItem[]>([]);
  const [movimientos, setMovimientos] = useState<HistorialMovimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: perfil } = await supabase
            .from("usuarios")
            .select("nombre_completo")
            .eq("id", user.id)
            .maybeSingle();
          
          if (perfil?.nombre_completo) {
            setUserName(perfil.nombre_completo.split(" ")[0]);
          }
        }

        const [
          { count: totalArticulos },
          { data: todosLosActivos },
          { count: prestamosActivos },
          { count: dadosBajaCount },
          { data: movData },
        ] = await Promise.all([
          supabase.from("inventario").select("*", { count: "exact", head: true }),
          supabase.from("inventario").select("*").eq("estado", "activo"),
          supabase.from("prestamos").select("*", { count: "exact", head: true }).eq("estado", "activo"),
          supabase.from("inventario").select("*", { count: "exact", head: true }).eq("estado", "dado_de_baja"),
          supabase.from("historial_inventario").select(`
              *,
              inventario (nombre, clave),
              usuarios (nombre_completo)
            `)
            .order("fecha", { ascending: false })
            .limit(5),
        ]);

        const alertasStock = (todosLosActivos || [])
          .filter(item => item.stock_disponible <= item.stock_minimo)
          .slice(0, 5);

        setStats({
          totalArticulos: totalArticulos ?? 0,
          stockBajo: alertasStock.length,
          prestamosActivos: prestamosActivos ?? 0,
          dadosBaja: dadosBajaCount ?? 0,
        });

        setStockBajoItems(alertasStock as InventarioItem[]);
        setMovimientos(movData as unknown as HistorialMovimiento[] ?? []);

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const movimientoColor = (tipo: string) => {
    const map: Record<string, string> = {
      entrada: "bg-emerald-100 text-emerald-700",
      salida: "bg-orange-100 text-orange-700",
      prestamo: "bg-blue-100 text-blue-700",
      devolucion: "bg-teal-100 text-teal-700",
      ajuste: "bg-purple-100 text-purple-700",
      baja: "bg-red-100 text-red-700",
    };
    return map[tipo] ?? "bg-gray-100 text-gray-700";
  };

  const formatFecha = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return new Date(fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Contenido Principal con margen responsive */}
      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          
          {/* Bienvenida */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {new Date().getHours() < 12 ? " Buenos días" : new Date().getHours() < 18 ? " Buenas tardes" : " Buenas noches"}, {userName} 
            </h1>
            <p className="text-slate-500 font-medium mt-1">Esto es lo que está pasando en tu inventario hoy.</p>
          </div>

          {/* Stats Cards: Grid responsive de 1 a 4 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              title="Total artículos" 
              value={stats?.totalArticulos ?? 0} 
              isLoading={isLoading} 
              iconColor="blue" 
              icon={<Box size={20} />}
            />
            <StatsCard 
              title="Stock bajo" 
              value={stats?.stockBajo ?? 0} 
              isLoading={isLoading} 
              iconColor="amber" 
              subtitle="Requieren atención" 
              icon={<AlertTriangle size={20} />}
            />
            <StatsCard 
              title="Préstamos" 
              value={stats?.prestamosActivos ?? 0} 
              isLoading={isLoading} 
              iconColor="green" 
              icon={<RefreshCw size={20} />}
            />
            <StatsCard 
              title="Bajas" 
              value={stats?.dadosBaja ?? 0} 
              isLoading={isLoading} 
              iconColor="red" 
              icon={<Trash2 size={20} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sección Alertas de Stock */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-500" /> Alertas de Stock
                </h2>
                <Link href="/inventario" className="text-xs text-blue-600 font-bold hover:underline">Gestionar</Link>
              </div>
              <div className="divide-y divide-slate-50 flex-1">
                {isLoading ? <SkeletonLoader/> : stockBajoItems.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-slate-400 text-sm font-medium">Todo el stock está correcto </p>
                  </div>
                ) : (
                  stockBajoItems.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.nombre}</p>
                        <p className="text-xs text-slate-400 font-mono">{item.clave}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                          {item.stock_disponible} unid.
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Mín: {item.stock_minimo}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sección Movimientos Recientes */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" /> Actividad Reciente
                </h2>
                <Link href="/historial" className="text-xs text-blue-600 font-bold hover:underline">Ver historial</Link>
              </div>
              <div className="divide-y divide-slate-50 flex-1">
                {!isLoading && movimientos.map((mov) => (
                  <div key={mov.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-lg ${movimientoColor(mov.tipo_movimiento)}`}>
                      {mov.tipo_movimiento}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{(mov.inventario as any)?.nombre}</p>
                      <p className="text-[11px] text-slate-500 font-medium tracking-tight truncate">
                        Por: {(mov.usuarios as any)?.nombre_completo}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-slate-700">x{mov.cantidad}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{formatFecha(mov.fecha)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function SkeletonLoader() { 
  return (
    <div className="p-6 space-y-4">
      <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse"/>
      <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse"/>
      <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse"/>
    </div> 
  );
}