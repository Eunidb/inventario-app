/**
 * @file app/inventario/page.tsx
 * @description Vista de inventario con Lucide-react, sin cabecera de acciones y selects personalizados.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from '@/lib/client'
import Sidebar from "@/components/sidebar";
import ModalGestion from "@/components/ModalGestion";
import type { InventarioItem, Categoria, EstadoInventarioEnum } from "@/lib/supabase";

// Importación de Lucide React
import { 
  Plus, 
  Search, 
  Package, 
  Pencil, 
  Trash2, 
  ChevronDown 
} from "lucide-react";

const supabase = createClient()

const ESTADO_LABELS: Record<EstadoInventarioEnum, { label: string; cls: string }> = {
  activo:         { label: "Activo",         cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  inactivo:       { label: "Inactivo",       cls: "bg-slate-100 text-slate-600 border-slate-200" },
  en_reparacion: { label: "En reparación",  cls: "bg-amber-50 text-amber-700 border-amber-100" },
  mantenimiento: { label: "Mantenimiento",  cls: "bg-blue-50 text-blue-700 border-blue-100" },
  dado_de_baja:   { label: "Baja",           cls: "bg-rose-50 text-rose-700 border-rose-100" },
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
  const [isAdmin, setIsAdmin]       = useState(false);

  // Estados de dropdowns
  const [openCat, setOpenCat] = useState(false);
  const [openEst, setOpenEst] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.rol === 'admin') setIsAdmin(true);
    };
    checkRole();
  }, []);

  const loadInventario = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("inventario")
        .select(`*, categorias(nombre), departamentos(nombre)`, { count: "exact" })
        .order("nombre")
        .range((page - 1) * 15, page * 15 - 1);

      if (search.trim()) query = query.or(`nombre.ilike.%${search}%,clave.ilike.%${search}%`);
      if (catFilter) query = query.eq("categoria_id", catFilter);
      if (estFilter) query = query.eq("estado", estFilter);

      const { data, error } = await query;
      if (error) throw error;
      setItems(data as InventarioItem[] ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, catFilter, estFilter, page]);

  useEffect(() => {
    supabase.from("categorias").select("*").order("nombre").then(({ data }) => setCategorias(data ?? []));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadInventario, 300);
    return () => clearTimeout(timer);
  }, [loadInventario]);

  const handleEdit = (item: InventarioItem) => { setEditItem(item); setModalOpen(true); };
  
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este artículo permanentemente?")) return;
    const { error } = await supabase.from("inventario").delete().eq("id", id);
    if (!error) loadInventario();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1>
              <p className="text-slate-500 font-medium">Gestión de activos y stock</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => { setEditItem(null); setModalOpen(true); }} 
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
              >
                <Plus size={20} strokeWidth={2.5} />
                <span>Nuevo Artículo</span>
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="relative lg:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar por nombre o SKU..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none text-slate-700 font-medium transition-all"
                />
              </div>

              {/* Dropdown Categorías */}
              <div className="relative">
                <button 
                  onClick={() => {setOpenCat(!openCat); setOpenEst(false)}}
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-600 font-medium transition-all"
                >
                  <span className="truncate">{categorias.find(c => c.id === catFilter)?.nombre || "Todas las categorías"}</span>
                  <ChevronDown className={`transition-transform duration-200 ${openCat ? 'rotate-180' : ''}`} size={18} />
                </button>
                {openCat && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1 animate-in fade-in zoom-in duration-150">
                    <button onClick={() => {setCatFilter(null); setOpenCat(false); setPage(1)}} className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-sm font-medium">Todas las categorías</button>
                    {categorias.map(c => (
                      <button key={c.id} onClick={() => {setCatFilter(c.id); setOpenCat(false); setPage(1)}} className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-sm font-medium">{c.nombre}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown Estados */}
              <div className="relative">
                <button 
                  onClick={() => {setOpenEst(!openEst); setOpenCat(false)}}
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-600 font-medium transition-all"
                >
                  <span className="truncate">{ESTADO_LABELS[estFilter as EstadoInventarioEnum]?.label || "Cualquier estado"}</span>
                  <ChevronDown className={`transition-transform duration-200 ${openEst ? 'rotate-180' : ''}`} size={18} />
                </button>
                {openEst && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in duration-150">
                    <button onClick={() => {setEstFilter(""); setOpenEst(false); setPage(1)}} className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-sm font-medium">Cualquier estado</button>
                    {Object.entries(ESTADO_LABELS).map(([val, { label }]) => (
                      <button key={val} onClick={() => {setEstFilter(val); setOpenEst(false); setPage(1)}} className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-sm font-medium">{label}</button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículo</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Categoría</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Stock</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    {/* Se quitó la palabra "Acciones" */}
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-400 font-medium">Cargando inventario...</td></tr>
                  ) : items.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {item.imagen_url ? <img src={item.imagen_url} alt="" className="w-full h-full object-cover" /> : <Package className="text-slate-400" size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{item.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{item.clave}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 hidden lg:table-cell">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          {(item.categorias as any)?.nombre ?? "General"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-800">{item.stock_disponible}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Total: {item.stock_total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${ESTADO_LABELS[item.estado]?.cls}`}>
                          {ESTADO_LABELS[item.estado]?.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                            title="Editar artículo"
                          >
                            <Pencil size={18} />
                          </button>
                          {isAdmin && (
      <button 
        onClick={() => handleDelete(item.id.toString())}
        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
        title="Eliminar permanentemente"
      >
        <Trash2 size={18} />
      </button>
    )}
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

      <ModalGestion isOpen={modalOpen} onClose={() => setModalOpen(false)} item={editItem} onSaved={loadInventario} />
    </div>
  );
}