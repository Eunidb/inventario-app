/**
 * @file app/inventario/page.tsx
 * @description Vista de inventario mejorada con Buscador Dinámico y Modal de Confirmación para eliminación.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalGestion from "@/components/ModalGestion";
import ModalFichaTecnica from "@/components/ModalFichaTecnica";
import ModalConfirmar from "@/components/ModalConfirmar";
import type { InventarioItem, Categoria, EstadoInventarioEnum } from "@/lib/supabase";
import {
  Plus, Search, Package, Pencil, Trash2,
  ChevronDown, ChevronLeft, ChevronRight,
  Eye, MapPin, Tag, X
} from "lucide-react";

// ─── Estilos por estado ──────────────────────────────────────────────────────
const ESTADO_LABELS: Record<EstadoInventarioEnum, { label: string; cls: string; dot: string }> = {
  activo:        { label: "Activo",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  inactivo:      { label: "Inactivo",      cls: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400" },
  en_reparacion: { label: "En reparación", cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  mantenimiento: { label: "Mantenimiento", cls: "bg-[#004091]/10 text-[#004091] border-[#004091]/20", dot: "bg-[#004091]" },
  dado_de_baja:  { label: "Baja",          cls: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
};

const PER_PAGE = 50;

export default function InventarioPage() {
  const [items, setItems]           = useState<InventarioItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState<number | null>(null);
  const [estFilter, setEstFilter]   = useState<string>("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<InventarioItem | null>(null);
  const [fichaItem, setFichaItem]   = useState<InventarioItem | null>(null); 
  const [page, setPage]             = useState(1);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [openCat, setOpenCat]       = useState(false);
  const [openEst, setOpenEst]       = useState(false);

  // Estados para el Modal de Confirmación de Eliminación Dinámico
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete]       = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.rol === "admin") setIsAdmin(true);
    };
    checkRole();
  }, []);

  const loadInventario = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      let query = supabase
        .from("inventario")
        .select(`*, categorias(nombre), departamentos(nombre)`, { count: "exact" })
        .order("fecha_creacion", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (search.trim()) query = query.or(`nombre.ilike.%${search}%,clave.ilike.%${search}%`);
      if (catFilter)     query = query.eq("categoria_id", catFilter);
      if (estFilter)     query = query.eq("estado", estFilter);

      const { data, error, count } = await query;
      if (error) throw error;
      setItems(data as InventarioItem[] ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, catFilter, estFilter, page]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("categorias").select("*").order("nombre")
      .then(({ data }) => setCategorias(data ?? []));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadInventario, 300);
    return () => clearTimeout(timer);
  }, [loadInventario]);

  const handleEdit = (item: InventarioItem) => { setEditItem(item); setModalOpen(true); };

  // Disparador del Modal de confirmación estilizado
  const requireDeleteConfirm = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  // Ejecución definitiva del borrado tras confirmación en el Modal
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const supabase = createClient();
    const { error } = await supabase.from("inventario").delete().eq("id", itemToDelete);
    if (!error) {
      loadInventario();
    }
    setItemToDelete(null);
    setDeleteModalOpen(false);
  };

  const rangoDesde   = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangoHasta   = Math.min(page * PER_PAGE, totalCount);
  const totalPaginas = Math.ceil(totalCount / PER_PAGE);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-6 lg:p-10 pt-20 lg:pt-10 max-w-[1400px] mx-auto">

          {/* ── Encabezado ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1>
              <p className="text-slate-500 font-medium">Gestión de artículos y existencias</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setEditItem(null); setModalOpen(true); }}
                className="inline-flex items-center justify-center gap-2 bg-[#004091] hover:bg-[#002b63] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#004091]/30 transition-all hover:-translate-y-0.5 active:scale-95 w-full md:w-auto"
              >
                <Plus size={20} strokeWidth={2.5} />
                <span>Nuevo Artículo</span>
              </button>
            )}
          </div>

          {/* ── Filtros Avanzados ── */}
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Buscador Inteligente con botón de borrado dinámico (X) */}
              <div className="relative md:col-span-2 group flex items-center">
                <Search className="absolute left-4 text-[#004091]/50 group-focus-within:text-[#004091] transition-colors pointer-events-none" size={18} strokeWidth={2.5} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar por nombre, marca o clave..."
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 text-slate-800 placeholder-slate-400 font-medium text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#004091] focus:ring-4 focus:ring-[#004091]/10 transition-all duration-200"
                />
                {search.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-3 p-1.5 rounded-lg bg-slate-200/50 hover:bg-[#004091]/10 text-slate-500 hover:text-[#004091] transition-colors"
                    title="Borrar búsqueda"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Dropdown Categoría */}
              <div className="relative">
                <button
                  onClick={() => { setOpenCat(!openCat); setOpenEst(false); }}
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#004091]/50 focus:border-[#004091] focus:ring-4 focus:ring-[#004091]/10 text-slate-700 font-medium transition-all"
                >
                  <span className="truncate text-sm">
                    {categorias.find(c => c.id === catFilter)?.nombre || "Todas las categorías"}
                  </span>
                  <ChevronDown className={`flex-shrink-0 transition-transform duration-200 ${openCat ? "rotate-180 text-[#004091]" : "text-slate-400"}`} size={18} />
                </button>
                {openCat && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button onClick={() => { setCatFilter(null); setOpenCat(false); setPage(1); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#004091]/5 hover:text-[#004091] text-sm font-medium transition-colors">
                      Todas las categorías
                    </button>
                    {categorias.map(c => (
                      <button key={c.id} onClick={() => { setCatFilter(c.id); setOpenCat(false); setPage(1); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#004091]/5 hover:text-[#004091] text-sm font-medium transition-colors">
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown Estado */}
              <div className="relative">
                <button
                  onClick={() => { setOpenEst(!openEst); setOpenCat(false); }}
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#004091]/50 focus:border-[#004091] focus:ring-4 focus:ring-[#004091]/10 text-slate-700 font-medium transition-all"
                >
                  <span className="truncate text-sm">
                    {ESTADO_LABELS[estFilter as EstadoInventarioEnum]?.label || "Cualquier estado"}
                  </span>
                  <ChevronDown className={`flex-shrink-0 transition-transform duration-200 ${openEst ? "rotate-180 text-[#004091]" : "text-slate-400"}`} size={18} />
                </button>
                {openEst && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button onClick={() => { setEstFilter(""); setOpenEst(false); setPage(1); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#004091]/5 hover:text-[#004091] text-sm font-medium transition-colors">
                      Cualquier estado
                    </button>
                    {Object.entries(ESTADO_LABELS).map(([val, { label }]) => (
                      <button key={val} onClick={() => { setEstFilter(val); setOpenEst(false); setPage(1); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#004091]/5 hover:text-[#004091] text-sm font-medium transition-colors">
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Tabla de Contenido ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Artículo
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell whitespace-nowrap">
                      Categoría
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden xl:table-cell whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#004091]" />
                        Ubicación
                      </div>
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">
                      Stock
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center hidden sm:table-cell whitespace-nowrap">
                      Estado
                    </th>
                    <th className="px-6 py-4 w-28 whitespace-nowrap"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
                            <div className="space-y-2.5">
                              <div className="h-3.5 bg-slate-100 rounded-md w-32 md:w-48 animate-pulse" />
                              <div className="h-2.5 bg-slate-100 rounded-md w-20 animate-pulse" />
                            </div>
                          </div>
                        </td>
                        {[...Array(4)].map((_, j) => (
                          <td key={j} className="px-5 py-4 hidden sm:table-cell">
                            <div className="h-3 bg-slate-100 rounded-md w-full max-w-[80px] mx-auto animate-pulse" />
                          </td>
                        ))}
                        <td className="px-6 py-4" />
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Search size={40} className="text-slate-300 mb-4" />
                          <p className="text-slate-600 text-base font-semibold">No se encontraron resultados</p>
                          <p className="text-slate-400 text-sm mt-1">Intenta ajustando los filtros de búsqueda.</p>
                        </div>
                      </td>
                    </tr>
                  ) : items.map((item) => {
                    const est = ESTADO_LABELS[item.estado];
                    const stockBajo = item.stock_disponible <= item.stock_minimo;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">

                        {/* ── Artículo ── */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {item.imagen_url
                                ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                                : <Package className="text-slate-400" size={24} strokeWidth={1.5} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-[160px] md:max-w-[220px]">{item.nombre}</p>
                              <p className="text-[10px] font-mono text-[#004091] bg-[#004091]/10 px-1.5 py-0.5 rounded flex-inline inline-block uppercase tracking-wider mt-1">
                                {item.clave}
                              </p>
                              {item.marca && (
                                <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[150px]">{item.marca}{item.modelo ? ` · ${item.modelo}` : ""}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ── Categoría ── */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold whitespace-nowrap">
                            <Tag size={12} className="text-[#004091]" />
                            {(item.categorias as any)?.nombre ?? "General"}
                          </span>
                        </td>

                        {/* ── Ubicación ── */}
                        <td className="px-5 py-4 hidden xl:table-cell">
                          {item.ubicacion ? (
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px]">{item.ubicacion}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm italic">—</span>
                          )}
                        </td>

                        {/* ── Stock ── */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-black ${stockBajo ? "text-red-600" : "text-slate-800"}`}>
                              {item.stock_disponible}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                              Total: {item.stock_total}
                            </span>
                            {stockBajo && (
                              <span className="text-[9px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded mt-1 uppercase tracking-wider animate-pulse whitespace-nowrap">
                                Stock bajo
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ── Estado ── */}
                        <td className="px-5 py-4 text-center hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap ${est?.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${est?.dot}`} />
                            {est?.label}
                          </span>
                        </td>

                        {/* ── Acciones Responsivas ── */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setFichaItem(item)}
                              className="p-2 rounded-lg text-slate-400 hover:text-[#004091] hover:bg-[#004091]/10 transition-colors"
                              title="Ver ficha técnica"
                            >
                              <Eye size={18} strokeWidth={2} />
                            </button>

                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Editar artículo"
                            >
                              <Pencil size={18} strokeWidth={2} />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => requireDeleteConfirm(item.id.toString())}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Eliminar permanentemente"
                              >
                                <Trash2 size={18} strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Paginación ── */}
            <div className="px-4 md:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-500 order-2 sm:order-1">
                {isLoading ? "Cargando..." : totalCount === 0 ? "Sin resultados" : (
                  <>
                    Mostrando del <span className="text-slate-900 font-bold">{rangoDesde}</span> al <span className="text-slate-900 font-bold">{rangoHasta}</span> de <span className="text-slate-900 font-bold">{totalCount}</span> artículos
                  </>
                )}
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-lg text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-slate-700 min-w-[70px] text-center">
                  {page} / {totalPaginas || 1}
                </span>
                <button
                  disabled={page >= totalPaginas || isLoading}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-lg text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modal: Editar / crear artículo */}
      <ModalGestion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
        onSaved={loadInventario}
      />

      {/* Modal: Ficha técnica completa centrada y responsiva */}
      {fichaItem && (
        <ModalFichaTecnica
          item={fichaItem}
          onClose={() => setFichaItem(null)}
          onEditar={() => { setFichaItem(null); handleEdit(fichaItem); }}
        />
      )}

      {/* Modal: Confirmación de Eliminación Premium centrado */}
      <ModalConfirmar
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        titulo="¿Eliminar artículo definitivamente?"
        mensaje="Esta operación no se puede deshacer. El artículo se borrará de forma permanente de la base de datos de Supabase junto con todo su historial de stock."
        tipo="delete"
      />
    </div>
  );
}