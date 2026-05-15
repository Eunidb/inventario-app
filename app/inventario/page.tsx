/**
 * @file app/inventario/page.tsx
 * @description Vista de inventario mejorada.
 *
 * MEJORAS EN ESTA VERSIÓN:
 *  1. Imágenes de artículo más grandes (w-16 h-16).
 *  2. Columna "Ubicación" visible en pantallas xl.
 *  3. Icono ojo (Eye) que abre el modal de Ficha Técnica completa.
 *  4. Modal FichaTecnica con todos los datos del artículo.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalGestion from "@/components/ModalGestion";
import type { InventarioItem, Categoria, EstadoInventarioEnum } from "@/lib/supabase";
import {
  Plus, Search, Package, Pencil, Trash2,
  ChevronDown, ChevronLeft, ChevronRight,
  Eye, MapPin, X, Hash, Tag, Layers,
  Info, BarChart3, Calendar,
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
  const [fichaItem, setFichaItem]   = useState<InventarioItem | null>(null); // Ficha técnica
  const [page, setPage]             = useState(1);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [openCat, setOpenCat]       = useState(false);
  const [openEst, setOpenEst]       = useState(false);

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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este artículo permanentemente?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("inventario").delete().eq("id", id);
    if (!error) loadInventario();
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
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
              >
                <Plus size={20} strokeWidth={2.5} />
                <span>Nuevo Artículo</span>
              </button>
            )}
          </div>

          {/* ── Filtros ── */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Búsqueda */}
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

              {/* Dropdown Categoría */}
              <div className="relative">
                <button
                  onClick={() => { setOpenCat(!openCat); setOpenEst(false); }}
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-600 font-medium transition-all"
                >
                  <span className="truncate text-sm">
                    {categorias.find(c => c.id === catFilter)?.nombre || "Todas las categorías"}
                  </span>
                  <ChevronDown className={`flex-shrink-0 transition-transform duration-200 ${openCat ? "rotate-180" : ""}`} size={18} />
                </button>
                {openCat && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1">
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
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-600 font-medium transition-all"
                >
                  <span className="truncate text-sm">
                    {ESTADO_LABELS[estFilter as EstadoInventarioEnum]?.label || "Cualquier estado"}
                  </span>
                  <ChevronDown className={`flex-shrink-0 transition-transform duration-200 ${openEst ? "rotate-180" : ""}`} size={18} />
                </button>
                {openEst && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-1">
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

          {/* ── Tabla ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {/* Artículo */}
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Artículo
                    </th>
                    {/* Categoría — visible en lg+ */}
                    <th className="px-5 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">
                      Categoría
                    </th>
                    {/* Ubicación — nueva columna, visible en xl+ */}
                    <th className="px-5 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} />
                        Ubicación
                      </div>
                    </th>
                    {/* Stock */}
                    <th className="px-5 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      Stock
                    </th>
                    {/* Estado */}
                    <th className="px-5 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center hidden sm:table-cell">
                      Estado
                    </th>
                    {/* Acciones — sin texto */}
                    <th className="px-6 py-5 w-32"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    /* Skeleton loader */
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
                    // Indicador visual de stock bajo
                    const stockBajo = item.stock_disponible <= item.stock_minimo;
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">

                        {/* ── Artículo: imagen grande + nombre + clave ── */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {/* Imagen — w-16 h-16 (64px × 64px) */}
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                              {item.imagen_url
                                ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                                : <Package className="text-slate-300" size={24} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate max-w-[180px]">{item.nombre}</p>
                              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                                {item.clave}
                              </p>
                              {/* Marca/modelo en filas pequeñas si existe */}
                              {item.marca && (
                                <p className="text-[10px] text-slate-400 mt-0.5">{item.marca}{item.modelo ? ` · ${item.modelo}` : ""}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ── Categoría ── */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-semibold">
                            <Tag size={10} />
                            {(item.categorias as any)?.nombre ?? "General"}
                          </span>
                        </td>

                        {/* ── Ubicación (columna nueva) ── */}
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

                        {/* ── Stock con indicador de alerta ── */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-black ${stockBajo ? "text-red-600" : "text-slate-800"}`}>
                              {item.stock_disponible}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Total: {item.stock_total}
                            </span>
                            {/* Badge de stock bajo */}
                            {stockBajo && (
                              <span className="text-[8px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md mt-0.5 uppercase tracking-wide">
                                Stock bajo
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ── Estado ── */}
                        <td className="px-5 py-4 text-center hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border ${est?.cls}`}>
                            {/* Punto indicador de color */}
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${est?.dot}`} />
                            {est?.label}
                          </span>
                        </td>

                        {/* ── Acciones: Ver ficha + Editar + Eliminar ── */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                            {/* Botón: Ver ficha técnica completa */}
                            <button
                              onClick={() => setFichaItem(item)}
                              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                              title="Ver ficha técnica"
                            >
                              <Eye size={17} />
                            </button>

                            {/* Botón: Editar */}
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100"
                              title="Editar artículo"
                            >
                              <Pencil size={17} />
                            </button>

                            {/* Botón: Eliminar — solo admin */}
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(item.id.toString())}
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

            {/* ── Paginación: "1–50 de 400" ── */}
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

      {/* Modal: editar / crear artículo */}
      <ModalGestion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
        onSaved={loadInventario}
      />

      {/* Modal: ficha técnica completa */}
      {fichaItem && (
        <ModalFichaTecnica
          item={fichaItem}
          onClose={() => setFichaItem(null)}
          onEditar={() => { setFichaItem(null); handleEdit(fichaItem); }}
        />
      )}
    </div>
  );
}

// ============================================================================
// MODAL: FICHA TÉCNICA COMPLETA
// Muestra todos los campos del artículo en un panel de lado derecho
// ============================================================================
function ModalFichaTecnica({
  item, onClose, onEditar,
}: {
  item: InventarioItem;
  onClose: () => void;
  onEditar: () => void;
}) {
  const est = ESTADO_LABELS[item.estado];

  // Formatea una fecha ISO a español
  const fmtFecha = (f?: string) =>
    f ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel deslizable desde la derecha */}
      <div className="ml-auto relative bg-white w-full max-w-lg h-full flex flex-col shadow-2xl">

        {/* ── Cabecera con imagen y datos principales ── */}
        <div className="flex-shrink-0 bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
          <div className="flex items-start justify-between mb-5">
            <span className="font-mono text-xs font-black text-slate-400 bg-slate-700/60 px-2.5 py-1 rounded-lg">
              {item.clave}
            </span>
            <div className="flex items-center gap-2">
              {/* Botón editar desde la ficha */}
              <button
                onClick={onEditar}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Editar
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Imagen grande en la ficha: 96×96 px */}
            <div className="w-24 h-24 rounded-2xl bg-slate-700 border border-slate-600 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xl">
              {item.imagen_url
                ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                : <Package size={36} className="text-slate-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white leading-tight">{item.nombre}</h2>
              {item.marca && (
                <p className="text-sm text-slate-400 font-medium mt-1">
                  {item.marca}{item.modelo ? ` · ${item.modelo}` : ""}
                </p>
              )}
              {/* Badge de estado */}
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border ${est?.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${est?.dot}`} />
                  {est?.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cuerpo con todos los campos ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Sección: Stock */}
          <Section icon={<BarChart3 size={15} />} titulo="Control de Stock">
            <div className="grid grid-cols-3 gap-3">
              <StockCard label="Disponible" value={item.stock_disponible}
                highlight={item.stock_disponible <= item.stock_minimo} />
              <StockCard label="Total" value={item.stock_total} />
              <StockCard label="Mínimo" value={item.stock_minimo} dimmed />
            </div>
            {item.unidad_medida && (
              <Campo label="Unidad de medida" valor={item.unidad_medida} />
            )}
          </Section>

          {/* Sección: Identificación técnica */}
          <Section icon={<Hash size={15} />} titulo="Identificación">
            <Campo label="Clave" valor={item.clave} mono />
            {item.marca          && <Campo label="Marca"          valor={item.marca} />}
            {item.modelo         && <Campo label="Modelo"         valor={item.modelo} />}
            {item.numero_serie   && <Campo label="Número de serie" valor={item.numero_serie} mono />}
          </Section>

          {/* Sección: Clasificación */}
          <Section icon={<Tag size={15} />} titulo="Clasificación">
            <Campo label="Categoría"    valor={(item.categorias as any)?.nombre ?? "Sin categoría"} />
            <Campo label="Departamento" valor={(item.departamentos as any)?.nombre ?? "Sin departamento"} />
            {item.ubicacion && <Campo label="Ubicación" valor={item.ubicacion} icon={<MapPin size={12} />} />}
          </Section>

          {/* Sección: Descripción */}
          {item.descripcion && (
            <Section icon={<Info size={15} />} titulo="Descripción">
              <p className="text-sm text-slate-600 leading-relaxed">{item.descripcion}</p>
            </Section>
          )}

          {/* Sección: Fechas */}
          <Section icon={<Calendar size={15} />} titulo="Registro">
            <Campo label="Fecha de alta"       valor={fmtFecha(item.fecha_creacion)} />
            <Campo label="Última actualización" valor={fmtFecha(item.updated_at)} />
          </Section>

        </div>
      </div>
    </div>
  );
}

// ── Componentes auxiliares del modal ────────────────────────────────────────

/** Sección con título e icono que agrupa campos relacionados */
function Section({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-500">{icon}</span>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{titulo}</p>
      </div>
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

/** Campo individual con etiqueta y valor */
function Campo({
  label, valor, mono = false, icon,
}: {
  label: string; valor: string | number; mono?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex-shrink-0">{label}</p>
      <p className={`text-sm font-semibold text-slate-700 text-right flex items-center gap-1 ${mono ? "font-mono" : ""}`}>
        {icon && <span className="text-slate-400">{icon}</span>}
        {valor}
      </p>
    </div>
  );
}

/** Tarjeta de stock con valor destacado */
function StockCard({
  label, value, highlight = false, dimmed = false,
}: {
  label: string; value: number; highlight?: boolean; dimmed?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 text-center border ${
      highlight ? "bg-red-50 border-red-100" : "bg-white border-slate-100"
    }`}>
      <p className={`text-2xl font-black leading-none ${
        highlight ? "text-red-600" : dimmed ? "text-slate-400" : "text-slate-800"
      }`}>
        {value}
      </p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1.5">{label}</p>
    </div>
  );
}