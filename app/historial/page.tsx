"use client";

import React, { useEffect, useState } from 'react';
import { 
  History, ArrowUpRight, ArrowDownLeft, ClipboardList, 
  RotateCcw, Settings, Trash2, Calendar, User, 
  Search, AlertCircle, ChevronDown, Menu 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';

// --- Interfaces ---
interface Movimiento {
  id: number;
  tipo_movimiento: 'entrada' | 'salida' | 'prestamo' | 'devolucion' | 'ajuste' | 'baja';
  cantidad: number;
  stock_antes: number;
  stock_despues: number;
  fecha: string;
  observaciones: string;
  inventario: { nombre: string; clave: string };
  usuarios: { nombre_completo: string };
  dept_origen: { nombre: string } | null;
  dept_destino: { nombre: string } | null;
  prestamos?: {
    fecha_devolucion: string;
    estado: string;
  };
}

const ITEMS_PER_PAGE = 10;

const HistorialPage = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchHistorial(0, true);
  }, []);

  const fetchHistorial = async (currentPage: number, isInitial: boolean = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('historial_inventario')
        .select(`
          *,
          inventario(nombre, clave),
          usuarios(nombre_completo),
          dept_origen:departamentos!departamento_origen(nombre),
          dept_destino:departamentos!departamento_destino(nombre),
          prestamos(fecha_devolucion, estado)
        `)
        .order('fecha', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        setMovimientos(prev => isInitial ? data : [...prev, ...data]);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistorial(nextPage);
  };

  const filteredMovimientos = movimientos.filter(m => {
    const matchesSearch = 
      m.inventario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.usuarios.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "atrasados") {
      const esPrestamoActivo = m.tipo_movimiento === 'prestamo';
      const fechaVencida = m.prestamos?.fecha_devolucion ? new Date(m.prestamos.fecha_devolucion) < new Date() : false;
      const noDevuelto = m.prestamos?.estado !== 'devuelto';
      return matchesSearch && esPrestamoActivo && fechaVencida && noDevuelto;
    }

    const matchesTab = filterType === "todos" ? true : m.tipo_movimiento === filterType;
    return matchesSearch && matchesTab;
  });

  const TabButton = ({ id, label, icon: Icon, color = "blue" }: any) => (
    <button
      onClick={() => { setFilterType(id); setPage(0); }}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border whitespace-nowrap
        ${filterType === id 
          ? `bg-${color}-600 text-white border-${color}-600 shadow-lg shadow-${color}-100` 
          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    // Contenedor principal con Flex para el Sidebar
    <div className="flex min-h-screen bg-[#f8fafc]">
      
      {/* Sidebar fijo en escritorio, oculto o toggle en móvil */}
      <Sidebar />

      {/* Contenido Principal con margen adaptable */}
      <main className="flex-1 w-full lg:ml-64 transition-all duration-300">
        <div className="p-4 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Adaptable */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <span className="p-2 md:p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200">
                    <History size={24} strokeWidth={3} />
                  </span>
                  Historial General
                </h1>
                <p className="text-slate-500 font-medium mt-2 text-sm md:text-base">Auditoría de movimientos y control de flujo.</p>
              </div>

              {/* Barra de búsqueda responsive */}
              <div className="relative group w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar equipo o responsable..."
                  className="pl-12 pr-4 py-3 md:py-3.5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none w-full transition-all font-medium text-sm"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filtros con Scroll Horizontal en Móvil */}
            <div className="flex overflow-x-auto pb-4 mb-8 gap-3 no-scrollbar touch-pan-x">
              <TabButton id="todos" label="Todos" icon={History} />
              <TabButton id="prestamo" label="Préstamos" icon={ClipboardList} />
              <TabButton id="atrasados" label="Atrasados" icon={AlertCircle} color="red" />
              <TabButton id="devolucion" label="Devoluciones" icon={RotateCcw} />
              <TabButton id="entrada" label="Entradas" icon={ArrowDownLeft} />
              <TabButton id="salida" label="Salidas" icon={ArrowUpRight} />
            </div>

            {/* Contenedor de Tabla con Scroll */}
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Detalle</th>
                      <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Artículo</th>
                      <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Cantidad</th>
                      <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Ubicación</th>
                      <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={5} className="py-20 text-center font-medium text-slate-400">Cargando...</td></tr>
                    ) : filteredMovimientos.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center font-medium text-slate-400">Sin resultados.</td></tr>
                    ) : filteredMovimientos.map((m) => {
                      const isAtrasado = m.tipo_movimiento === 'prestamo' && 
                                        m.prestamos?.fecha_devolucion && 
                                        new Date(m.prestamos.fecha_devolucion) < new Date() &&
                                        m.prestamos?.estado !== 'devuelto';

                      return (
                        <tr key={m.id} className="hover:bg-blue-50/40 transition-all group">
                          <td className="px-6 md:px-8 py-4 md:py-6">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className={`p-2.5 rounded-xl ${isAtrasado ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {isAtrasado ? <AlertCircle size={18} /> : <History size={18} />}
                              </div>
                              <div>
                                <p className={`text-[12px] md:text-sm font-bold uppercase tracking-tight ${isAtrasado ? 'text-red-600' : 'text-slate-700'}`}>
                                  {isAtrasado ? 'Atrasado' : m.tipo_movimiento}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                  <Calendar size={10} /> {new Date(m.fecha).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-4 md:py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">{m.inventario.nombre}</span>
                              <span className="text-[10px] font-black text-blue-400 mt-0.5">{m.inventario.clave}</span>
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-4 md:py-6">
                            <div className="flex items-center gap-3">
                              <span className="text-base md:text-lg font-black text-slate-700">{m.cantidad}</span>
                              <div className="h-6 w-[1px] bg-slate-100"></div>
                              <span className="text-[10px] font-bold text-slate-400">{m.stock_despues} total</span>
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-4 md:py-6">
                            <div className="text-[11px] space-y-1">
                              {m.dept_origen && <p className="text-slate-500">De: {m.dept_origen.nombre}</p>}
                              {m.dept_destino && <p className="text-slate-800 font-bold">A: {m.dept_destino.nombre}</p>}
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-4 md:py-6">
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full w-fit border border-slate-100">
                              <User size={12} className="text-blue-500" strokeWidth={3} />
                              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">{m.usuarios.nombre_completo}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer de la tabla / Cargar más */}
              {hasMore && (
                <div className="p-6 bg-slate-50/50 flex justify-center border-t border-slate-100">
                  <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? 'Cargando...' : 'Ver más historial'}
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HistorialPage;