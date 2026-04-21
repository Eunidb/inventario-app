"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/sidebar";
import ModalPrestamo from "@/components/ModalPrestamo";
import { createClient } from '@/lib/client';
import { 
  Plus, Search, Calendar, User as UserIcon, 
  Package, ChevronRight, Clock, CheckCircle2 
} from "lucide-react";

interface PrestamoExtendido {
  id: string;
  created_at: string;
  fecha_devolucion: string | null;
  estado: string;
  observaciones: string;
  usuarios: { nombre_completo: string } | null; 
  autorizador: { nombre_completo: string } | null;
}

export default function PrestamosPage() {
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [prestamos, setPrestamos] = useState<PrestamoExtendido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const cargarPrestamos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("prestamos")
        .select(`
          id, created_at, fecha_devolucion, estado, observaciones,
          usuarios:usuario_id (nombre_completo),
          autorizador:created_by (nombre_completo)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const dataFormateada = (data as any[]).map(item => ({
        ...item,
        usuarios: Array.isArray(item.usuarios) ? item.usuarios[0] : item.usuarios,
        autorizador: Array.isArray(item.autorizador) ? item.autorizador[0] : item.autorizador
      }));

      setPrestamos(dataFormateada as PrestamoExtendido[]);
    } catch (err) {
      console.error("Error al cargar préstamos:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    cargarPrestamos();
  }, [cargarPrestamos]);

  const prestamosFiltrados = prestamos.filter(p => 
    p.usuarios?.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* CONTENIDO PRINCIPAL: lg:ml-64 empuja el contenido cuando el sidebar está fijo */}
       <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          
          {/* ENCABEZADO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Préstamos</h1>
              <p className="text-slate-500 font-medium">Gestión de salidas y retornos de material</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all active:scale-95"
            >
              <Plus size={20} strokeWidth={3} /> Nueva Salida
            </button>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Buscar por nombre del solicitante..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
              <button className="whitespace-nowrap px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-tighter">
                Todos
              </button>
              <button className="whitespace-nowrap px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-black uppercase tracking-tighter">
                Activos
              </button>
            </div>
          </div>

          {/* LISTADO DE PRÉSTAMOS */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" />
                <p className="mt-2 text-slate-400 font-bold">Cargando historial...</p>
              </div>
            ) : prestamosFiltrados.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Package className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold">No se encontraron registros</p>
              </div>
            ) : (
              prestamosFiltrados.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white p-5 rounded-3xl border border-slate-100 hover:shadow-md transition-shadow group flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.estado === 'activo' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {item.estado === 'activo' ? <Clock size={24} /> : <CheckCircle2 size={24} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-700 tracking-tight">{item.usuarios?.nombre_completo}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${item.estado === 'activo' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.estado}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <UserIcon size={12} /> Aut: {item.autorizador?.nombre_completo || 'Sistema'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col justify-between md:items-end gap-1 border-t md:border-none pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Devolución estimada</p>
                      <p className="text-sm font-bold text-slate-600">
                        {item.fecha_devolucion ? new Date(item.fecha_devolucion).toLocaleDateString() : 'No definida'}
                      </p>
                    </div>
                    <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <ModalPrestamo 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={cargarPrestamos} 
      />
    </div>
  );
}