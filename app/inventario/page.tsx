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
  activo:        { label: "Activo",        cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  inactivo:      { label: "Inactivo",      cls: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400" },
  en_reparacion: { label: "En reparación", cls: "bg-amber-50 text-amber-700 border-amber-100",       dot: "bg-amber-500" },
  mantenimiento: { label: "Mantenimiento", cls: "bg-blue-50 text-blue-700 border-blue-100",          dot: "bg-blue-500" },
  dado_de_baja:  { label: "Baja",          cls: "bg-rose-50 text-rose-700 border-rose-100",          dot: "bg-rose-500" },
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
  };

  const rangoDesde   = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangoHasta   = Math.min(page * PER_PAGE, totalCount);
  const totalPaginas = Math.ceil(totalCount / PER_PAGE);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-[1400px] mx-auto">

          {/* ── Encabezado ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1>
              <p className="text-slate-500 font-medium">Gestión de activos y stock</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setEditItem(null); setModalOpen(true); }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Plus size={20} strokeWidth={2.5} />
                <span>Nuevo Artículo</span>
              </button>
            )}
          </div>

          {/* ── Filtros Avanzados en Tonos Azules ── */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-50 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Buscador Inteligente con botón de borrado dinámico (X) */}
              <div className="relative lg:col-span-2 group flex items-center">
                <Search className="absolute left-4 text-blue-500/70 group-focus-within:text-blue-600 transition-colors pointer-events-none" size={18} strokeWidth={2.5} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar por nombre, marca o clave..."
                  className="w-full pl-11 pr-11 py-3 bg-slate-50/50 text-slate-800 placeholder-slate-400 font-medium text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                />
                {search.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-3 p-1.5 rounded-lg bg-slate-200/60 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
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
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50/50 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-600 font-medium transition-all"
                >
                  <span className="truncate text-sm">
                    {categorias.find(c => c.id === catFilter)?.nombre || "Todas las categorías"}
                  </span>
                  <ChevronDown className={`flex-shrink-0 transition-transform duration-200 ${openCat ? "rotate-180 text-blue-500" : ""}`} size={18} />
                </button>
                {openCat && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-blue-100 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button onClick={() => { setCatFilter(null); setOpenCat(false); setPage(1); }}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-sm font-medium">
                      Todas las categorías
                    </button>
                    {categorias.map(c => (
                      <button key={c.id} onClick={() => { setCatFilter(c.id); setOpenCat(false); setPage(1); }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-sm font-medium">
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
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50/50 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-600 font-medium transition-all"
                >
                  <span className="truncate text-sm">
                    {ESTADO_LABELS[estFilter as EstadoInventarioEnum]?.label || "Cualquier estado"}
                  </span>
                  <ChevronDown className={`flex-shrink-0 transition-transform duration-200 ${openEst ? "rotate-180 text-blue-500" : ""}`} size={18} />
                </button>
                {openEst && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-blue-100 rounded-xl shadow-xl p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button onClick={() => { setEstFilter(""); setOpenEst(false); setPage(1); }}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-sm font-medium">
                      Cualquier estado
                    </button>
                    {Object.entries(ESTADO_LABELS).map(([val, { label }]) => (
                      <button key={val} onClick={() => { setEstFilter(val); setOpenEst(false); setPage(1); }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-sm font-medium">
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Tabla de Contenido ── */}
          <div className="bg-white rounded-3xl border border-blue-50 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Artículo
                    </th>
                    <th className="px-5 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">
                      Categoría
                    </th>
                    <th className="px-5 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-blue-500" />
                        Ubicación
                      </div>
                    </th>
                    <th className="px-5 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      Stock
                    </th>
                    <th className="px-5 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center hidden sm:table-cell">
                      Estado
                    </th>
                    <th className="px-6 py-5 w-32"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 animate-pulse flex-shrink-0" />
                            <div className="space-y-2">
                              <div className="h-3.5 bg-slate-100 rounded-lg w-36 animate-pulse" />
                              <div className="h-2.5 bg-slate-100 rounded-lg w-20 animate-pulse" />
                            </div>
                          </div>
                        </td>
                        {[...Array(4)].map((_, j) => (
                          <td key={j} className="px-5 py-4 hidden lg:table-cell">
                            <div className="h-3 bg-slate-100 rounded-lg w-24 animate-pulse" />
                          </td>
                        ))}
                        <td className="px-6 py-4" />
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 text-sm font-medium">
                        No se encontraron artículos con los filtros actuales
                      </td>
                    </tr>
                  ) : items.map((item) => {
                    const est = ESTADO_LABELS[item.estado];
                    const stockBajo = item.stock_disponible <= item.stock_minimo;
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">

                        {/* ── Artículo ── */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-blue-50 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                              {item.imagen_url
                                ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                                : <Package className="text-blue-300" size={24} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate max-w-[180px]">{item.nombre}</p>
                              <p className="text-[10px] font-mono text-blue-600 bg-blue-50/60 px-1.5 py-0.5 rounded-md inline-block uppercase tracking-wider mt-0.5">
                                {item.clave}
                              </p>
                              {item.marca && (
                                <p className="text-[10px] text-slate-400 mt-0.5">{item.marca}{item.modelo ? ` · ${item.modelo}` : ""}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ── Categoría ── */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-semibold">
                            <Tag size={10} className="text-blue-500" />
                            {(item.categorias as any)?.nombre ?? "General"}
                          </span>
                        </td>

                        {/* ── Ubicación ── */}
                        <td className="px-5 py-4 hidden xl:table-cell">
                          {item.ubicacion ? (
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px]">{item.ubicacion}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* ── Stock ── */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-black ${stockBajo ? "text-red-600" : "text-blue-950"}`}>
                              {item.stock_disponible}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Total: {item.stock_total}
                            </span>
                            {stockBajo && (
                              <span className="text-[8px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md mt-0.5 uppercase tracking-wide animate-pulse">
                                Stock bajo
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ── Estado ── */}
                        <td className="px-5 py-4 text-center hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border ${est?.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${est?.dot}`} />
                            {est?.label}
                          </span>
                        </td>

                        {/* ── Acciones Responsivas / Dinámicas ── */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setFichaItem(item)}
                              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                              title="Ver ficha técnica"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100"
                              title="Editar artículo"
                            >
                              <Pencil size={17} />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => requireDeleteConfirm(item.id.toString())}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                title="Eliminar permanentemente"
                              >
                                <Trash2 size={17} />
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
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {isLoading ? "Cargando..." : totalCount === 0 ? "Sin resultados" : (
                  <>
                    <span className="text-slate-900 font-bold">{rangoDesde}–{rangoHasta}</span>
                    {" "}de{" "}
                    <span className="text-slate-900 font-bold">{totalCount}</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-600 min-w-[60px] text-center">
                  {page} / {totalPaginas || 1}
                </span>
                <button
                  disabled={page >= totalPaginas || isLoading}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={16} />
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