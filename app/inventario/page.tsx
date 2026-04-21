/**
 * @file app/inventario/page.tsx
 * @description Vista principal del inventario optimizada con diseño responsivo y paleta azul profesional.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from '@/lib/client'
import Sidebar from "@/components/sidebar";
import ModalGestion from "@/components/ModalGestion";
import type { InventarioItem, Categoria, EstadoInventarioEnum } from "@/lib/supabase";

const supabase = createClient()

// Colores de estado vibrantes para contrastar con el fondo limpio
const ESTADO_LABELS: Record<EstadoInventarioEnum, { label: string; cls: string }> = {
  activo:        { label: "Activo",         cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  inactivo:      { label: "Inactivo",       cls: "bg-slate-100 text-slate-600 border-slate-200" },
  en_reparacion: { label: "En reparación",  cls: "bg-amber-50 text-amber-700 border-amber-100" },
  mantenimiento: { label: "Mantenimiento",  cls: "bg-blue-50 text-blue-700 border-blue-100" },
  dado_de_baja:  { label: "Baja",           cls: "bg-rose-50 text-rose-700 border-rose-100" },
};

export default function InventarioPage() {
  const [items, setItems]           = useState<InventarioItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState<number | null>(null);
  const [estFilter, setEstFilter]   = useState<string>("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<InventarioItem | null>(null);
  const [page, setPage]             = useState(1);
  const PER_PAGE = 15;

  const loadInventario = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("inventario")
        .select(`*, categorias(nombre), departamentos(nombre)`, { count: "exact" })
        .order("nombre")
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (search.trim()) {
        query = query.or(`nombre.ilike.%${search}%,clave.ilike.%${search}%`);
      }
      if (catFilter) {
        query = query.eq("categoria_id", catFilter);
      }
      if (estFilter) {
        query = query.eq("estado", estFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data as InventarioItem[] ?? []);
    } catch (err) {
      console.error("Error cargando inventario:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, catFilter, estFilter, page]);

  useEffect(() => {
    supabase.from("categorias").select("*").order("nombre").then(({ data }) => {
      setCategorias(data ?? []);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadInventario, 300);
    return () => clearTimeout(timer);
  }, [loadInventario]);

  const handleNew  = () => { setEditItem(null); setModalOpen(true); };
  const handleEdit = (item: InventarioItem) => { setEditItem(item); setModalOpen(true); };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      
      {/* 1. SIDEBAR */}
      <Sidebar />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1>
              <p className="text-slate-500 font-medium">Gestión de activos y stock de la empresa</p>
            </div>
            
            <button
              onClick={handleNew}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusIcon />
              <span>Nuevo Artículo</span>
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative lg:col-span-2">
                <SearchIcon />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar por nombre o SKU..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none text-slate-700"
                />
              </div>

              <select
                value={catFilter ?? ""}
                onChange={(e) => { setCatFilter(e.target.value ? Number(e.target.value) : null); setPage(1); }}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none text-slate-600 font-medium cursor-pointer"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>

              <select
                value={estFilter}
                onChange={(e) => { setEstFilter(e.target.value); setPage(1); }}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none text-slate-600 font-medium cursor-pointer"
              >
                <option value="">Cualquier estado</option>
                {Object.entries(ESTADO_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículo</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Categoría</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Stock</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <SkeletonRows />
                  ) : items.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {item.imagen_url ? (
                              <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <BoxIcon />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                              {item.nombre}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                              {item.clave}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 hidden lg:table-cell">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          {(item.categorias as any)?.nombre ?? "General"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-base font-black text-slate-800">{item.stock_disponible}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Total: {item.stock_total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${ESTADO_LABELS[item.estado]?.cls}`}>
                          {ESTADO_LABELS[item.estado]?.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                        >
                          <EditIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="text-slate-900 font-bold">{items.length}</span> activos
              </p>
              <div className="flex gap-3">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
                >
                  Anterior
                </button>
                <button
                  disabled={items.length < PER_PAGE}
                  onClick={() => setPage(p => p + 1)}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md shadow-blue-100"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <ModalGestion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
        onSaved={loadInventario}
      />
    </div>
  );
}

// ICONOS
function PlusIcon() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg> }
function SearchIcon() { return <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> }
function BoxIcon() { return <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> }
function EditIcon() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> }

function SkeletonRows() {
  return <>{[1, 2, 3, 4, 5].map(i => (
    <tr key={i}><td colSpan={5} className="px-8 py-6"><div className="h-6 bg-slate-100 rounded-lg animate-pulse w-full" /></td></tr>
  ))}</>
}