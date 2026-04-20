"use client";

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Package, 
  ArrowLeftRight, 
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';

// --- Interfaces basadas en tu SQL ---
interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

interface Movimiento {
  id: number;
  fecha: string;
  tipo_movimiento: string;
  cantidad: number;
  stock_antes: number;
  stock_despues: number;
  observaciones: string;
  inventario: { nombre: string; clave: string };
  usuarios: { nombre_completo: string };
}

export default function ReportesPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    prestamosActivos: 0,
    stockBajo: 0,
    movimientosMes: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Obtener Historial con relaciones
      const { data: histData, error: histError } = await supabase
        .from('historial_inventario')
        .select(`
          id, fecha, tipo_movimiento, cantidad, stock_antes, stock_despues, observaciones,
          inventario(nombre, clave),
          usuarios(nombre_completo)
        `)
        .order('fecha', { ascending: false });

      if (histError) throw histError;

      // 2. Obtener Estadísticas Rápidas
      const { count: itemsCount } = await supabase.from('inventario').select('*', { count: 'exact', head: true });
      const { count: prestamosCount } = await supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'activo');
      const { data: stockBajoData } = await supabase.from('inventario').select('id').lt('stock_disponible', ); // Ejemplo: menos de 5

      setStats({
        totalItems: itemsCount || 0,
        prestamosActivos: prestamosCount || 0,
        stockBajo: stockBajoData?.length || 0,
        movimientosMes: histData?.length || 0
      });

      // Mapeo seguro de datos
      const dataAplanada = (histData || []).map((h: any) => ({
        ...h,
        inventario: Array.isArray(h.inventario) ? h.inventario[0] : (h.inventario || { nombre: 'N/A', clave: 'S/N' }),
        usuarios: Array.isArray(h.usuarios) ? h.usuarios[0] : (h.usuarios || { nombre_completo: 'Sistema' })
      }));

      setMovimientos(dataAplanada);
    } catch (err) {
      console.error("Error en reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovimientos = movimientos.filter(m => {
    const matchesSearch = m.inventario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.usuarios.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFiltro === "todos" || m.tipo_movimiento === tipoFiltro;
    return matchesSearch && matchesTipo;
  });

  const cards: StatCard[] = [
    { label: "Total Inventario", value: stats.totalItems, icon: Package, color: "bg-blue-600" },
    { label: "Préstamos Activos", value: stats.prestamosActivos, icon: ArrowLeftRight, color: "bg-indigo-600" },
    { label: "Stock Crítico", value: stats.stockBajo, icon: AlertTriangle, color: "bg-red-500" },
    { label: "Movimientos / Mes", value: stats.movimientosMes, icon: TrendingUp, color: "bg-emerald-500" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 md:p-8 lg:p-12 transition-all">
        <div className="max-w-7xl mx-auto">
          
          {/* Header con botón de Exportar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100">
                  <BarChart3 size={24} />
                </span>
                Reportes Analíticos
              </h1>
              <p className="text-slate-500 font-medium mt-2">Visión general del flujo de suministros y equipos.</p>
            </div>
            
            <button className="flex items-center gap-2 bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm">
              <Download size={20} className="text-blue-600" />
              Exportar PDF
            </button>
          </div>

          {/* Grid de KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {cards.map((card, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center gap-5">
                <div className={`p-4 ${card.color} rounded-2xl text-white shadow-lg`}>
                  <card.icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sección de Historial Unificado */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                <h2 className="text-xl font-black text-slate-800">Historial Reciente</h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nombre..." 
                    className="pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 text-sm font-medium"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  onChange={(e) => setTipoFiltro(e.target.value)}
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="entrada">Entradas</option>
                  <option value="salida">Salidas</option>
                  <option value="prestamo">Préstamos</option>
                  <option value="devolucion">Devoluciones</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-8 py-5">Fecha / Hora</th>
                    <th className="px-8 py-5">Activo</th>
                    <th className="px-8 py-5">Tipo</th>
                    <th className="px-8 py-5">Cantidad</th>
                    <th className="px-8 py-5 text-center">Stock Final</th>
                    <th className="px-8 py-5">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={6} className="py-20 text-center font-bold text-slate-300">Generando reporte...</td></tr>
                  ) : filteredMovimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{new Date(m.fecha).toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-400">{new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{m.inventario.nombre}</span>
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{m.inventario.clave}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          m.tipo_movimiento === 'entrada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          m.tipo_movimiento === 'salida' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          m.tipo_movimiento === 'prestamo' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-purple-50 text-purple-600 border-purple-100'
                        }`}>
                          {m.tipo_movimiento}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-700">{m.cantidad} <span className="text-[10px] text-slate-400 font-normal">uds</span></span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-block px-4 py-1.5 bg-slate-100 rounded-full text-xs font-black text-slate-600">
                          {m.stock_despues}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileText size={12} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 italic">{m.usuarios.nombre_completo}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}