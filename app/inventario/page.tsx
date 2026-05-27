/**
 * @file app/inventario/page.tsx
 * @description Vista de inventario optimizada con diseño corporativo, buscador dinámico y desplazamiento responsivo.
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
  mantenimiento: { label: "Mantenimiento", cls: "bg-blue-50 text-[#004091] border-[#004091]/20",     dot: "bg-[#004091]" },
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
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar />

      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full overflow-hidden">
        <div className="p-4 md:p-6 lg:p-10 pt-20 lg:pt-10 max-w-[1400px] mx-auto space-y-6">

          {/* ── Encabezado ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Inventario</h1>
              <p className="text-sm text-slate-500 font-medium">Gestión integral de artículos, activos y existencias en tiempo real.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setEditItem(null); setModalOpen(true); }}
                className="inline-flex items-center justify-center gap-2 bg-[#004091] hover:bg-[#014ba0] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 w-full sm:w-auto text-sm"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Nuevo Artículo</span>
              </button>
            )}
          </div>

          {/* ── Filtros Avanzados ── */}
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Buscador con diseño formal */}
              <div className="relative md:col-span-2 flex items-center group">
                <Search className="absolute left-4 text-slate-400 group-focus-within:text-[#014ba0] transition-colors duration-200 pointer-events-none" size={18} strokeWidth={2.2} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar por nombre, marca o clave..."
                  className="w-full pl-11 pr-11 py-2.5 bg-slate-50 text-slate-900 placeholder-slate-400 font-medium text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#014ba0] focus:bg-white focus:ring-4 focus:ring-[#014ba0]/10 transition-all duration-200"
                />
                {search.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-all duration-200"
                    title="Borrar búsqueda"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Menú desplegable: Categoría */}
              <div className="relative">
                <button
                  onClick={() => { setOpenCat(!openCat); setOpenEst(false); }}
                  className="w-full flex items-center justify-between py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#014ba0]/50 focus:border-[#014ba0] focus:bg-white focus:ring-4 focus:ring-[#014ba0]/10 text-slate-700 font-medium transition-all duration-200 text-sm"
                >
                  <span className="truncate">
                    {categorias.find(c => c.id === catFilter)?.nombre || "Todas las categorías"}
                  </span>
                  <ChevronDown className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${openCat ? "rotate-180 text-[#014ba0]" : ""}`} size={16} />
                </button>
                {openCat && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button onClick={() => { setCatFilter(null); setOpenCat(false); setPage(1); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#014ba0] text-sm font-medium transition-colors duration-150">
                      Todas las categorías
                    </button>
                    {categorias.map(c => (
                      <button key={c.id} onClick={() => { setCatFilter(c.id); setOpenCat(false); setPage(1); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#014ba0] text-sm font-medium transition-colors duration-150">
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Menú desplegable: Estado */}
              <div className="relative">
                <button
                  onClick={() => { setOpenEst(!openEst); setOpenCat(false); }}
                  className="w-full flex items-center justify-between py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#014ba0]/50 focus:border-[#014ba0] focus:bg-white focus:ring-4 focus:ring-[#014ba0]/10 text-slate-700 font-medium transition-all duration-200 text-sm"
                >
                  <span className="truncate">
                    {ESTADO_LABELS[estFilter as EstadoInventarioEnum]?.label || "Cualquier estado"}
                  </span>
                  <ChevronDown className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${openEst ? "rotate-180 text-[#014ba0]" : ""}`} size={16} />
                </button>
                {openEst && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button onClick={() => { setEstFilter(""); setOpenEst(false); setPage(1); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#014ba0] text-sm font-medium transition-colors duration-150">
                      Cualquier estado
                    </button>
                    {Object.entries(ESTADO_LABELS).map(([val, { label }]) => (
                      <button key={val} onClick={() => { setEstFilter(val); setOpenEst(false); setPage(1); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#014ba0] text-sm font-medium transition-colors duration-150">
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Estructura de Tabla con Scroll Adaptable ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Contenedor con scroll horizontal fluido para pantallas pequeñas */}
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200">
              {/* Se define un ancho mínimo estricto para mantener proporciones en móviles */}
              <table className="w-full text-left border-collapse min-w-[950px] table-fixed">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Artículo</th>
                    <th className="px-5 py-4">Categoría</th>
                    <th className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#004091]" />
                        Ubicación
                      </div>
                    </th>
                    <th className="px-5 py-4 text-center">Stock</th>
                    <th className="px-5 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                              <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                            </div>
                          </div>
                        </td>
                        {[...Array(4)].map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3 bg-slate-100 rounded w-2/3 mx-auto" />
                          </td>
                        ))}
                        <td className="px-6 py-4" />
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                          <Search size={36} className="text-slate-300 mb-3" />
                          <p className="text-slate-700 font-semibold text-base">No se encontraron resultados</p>
                          <p className="text-slate-400 text-xs mt-1">Intente ajustar los parámetros de búsqueda o remueva los filtros activos.</p>
                        </div>
                      </td>
                    </tr>
                  ) : items.map((item) => {
                    const est = ESTADO_LABELS[item.estado];
                    const stockBajo = item.stock_disponible <= item.stock_minimo;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors duration-150 group">

                        {/* Columna: Artículo */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                              {item.imagen_url
                                ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                                : <Package className="text-slate-400" size={20} strokeWidth={1.5} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 truncate" title={item.nombre}>{item.nombre}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-mono text-[#004091] bg-[#004091]/10 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                                  {item.clave}
                                </span>
                                {item.marca && (
                                  <span className="text-xs text-slate-400 truncate max-w-[120px]">
                                    {item.marca}{item.modelo ? ` · ${item.modelo}` : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Columna: Categoría */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium whitespace-nowrap">
                            <Tag size={12} className="text-[#014ba0]" />
                            {(item.categorias as any)?.nombre ?? "General"}
                          </span>
                        </td>

                        {/* Columna: Ubicación */}
                        <td className="px-5 py-4">
                          {item.ubicacion ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                              <span className="truncate" title={item.ubicacion}>{item.ubicacion}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No especificada</span>
                          )}
                        </td>

                        {/* Columna: Stock */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className={`text-base font-bold tracking-tight ${stockBajo ? "text-rose-600" : "text-slate-900"}`}>
                              {item.stock_disponible}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Total: {item.stock_total}
                            </span>
                            {stockBajo && (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded mt-1 uppercase tracking-wider">
                                Stock bajo
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Columna: Estado */}
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${est?.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${est?.dot}`} />
                            {est?.label}
                          </span>
                        </td>

                        {/* Columna: Acciones Omitidas/Visibles con Efectos */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => setFichaItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#014ba0] hover:bg-[#014ba0]/5 transition-all duration-150"
                              title="Ver ficha técnica"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150"
                              title="Editar artículo"
                            >
                              <Pencil size={16} />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => requireDeleteConfirm(item.id.toString())}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150"
                                title="Eliminar artículo"
                              >
                                <Trash2 size={16} />
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

            {/* ── Paginación Formal ── */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-medium text-slate-500">
                {isLoading ? "Cargando registros..." : totalCount === 0 ? "Sin registros en inventario" : (
                  <>
                    Mostrando del <span className="text-slate-900 font-semibold">{rangoDesde}</span> al <span className="text-slate-900 font-semibold">{rangoHasta}</span> de <span className="text-slate-900 font-semibold">{totalCount}</span> artículos registrados
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all duration-150 shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-700 min-w-[60px] text-center">
                  {page} de {totalPaginas || 1}
                </span>
                <button
                  disabled={page >= totalPaginas || isLoading}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all duration-150 shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Componentes modales del sistema (Mantienen su lógica de operaciones intacta) */}
      <ModalGestion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
        onSaved={loadInventario}
      />

      {fichaItem && (
        <ModalFichaTecnica
          item={fichaItem}
          onClose={() => setFichaItem(null)}
          onEditar={() => { setFichaItem(null); handleEdit(fichaItem); }}
        />
      )}

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