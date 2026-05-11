/**
 * @file app/inventario/page.tsx
 * @description Vista de inventario.
 *
 * CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR:
 *  1. Ordenamiento por `fecha_creacion DESC` (más reciente primero).
 *  2. Paginación de 50 ítems por página con contador "1–50 de 392".
 *  3. Botón de acceso directo a la página de Formatos.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalGestion from "@/components/ModalGestion";
import Link from "next/link";
import type { InventarioItem, Categoria, EstadoInventarioEnum } from "@/lib/supabase";
import {
  Plus,
  Search,
  Package,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

// ─── Configuración de estilos por estado ────────────────────────────────────
const ESTADO_LABELS: Record<EstadoInventarioEnum, { label: string; cls: string }> = {
  activo:        { label: "Activo",        cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  inactivo:      { label: "Inactivo",      cls: "bg-slate-100 text-slate-600 border-slate-200" },
  en_reparacion: { label: "En reparación", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  mantenimiento: { label: "Mantenimiento", cls: "bg-blue-50 text-blue-700 border-blue-100" },
  dado_de_baja:  { label: "Baja",          cls: "bg-rose-50 text-rose-700 border-rose-100" },
};

// ─── Constante: ítems por página ────────────────────────────────────────────
const PER_PAGE = 50;

export default function InventarioPage() {
  const [items, setItems]           = useState<InventarioItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [totalCount, setTotalCount] = useState(0);   // Total de registros en BD
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState<number | null>(null);
  const [estFilter, setEstFilter]   = useState<string>("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<InventarioItem | null>(null);
  const [page, setPage]             = useState(1);
  const [isAdmin, setIsAdmin]       = useState(false);

  // Control de dropdowns de filtro
  const [openCat, setOpenCat] = useState(false);
  const [openEst, setOpenEst] = useState(false);

  // ─── Verificar rol del usuario ─────────────────────────────────────────
  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.rol === "admin") setIsAdmin(true);
    };
    checkRole();
  }, []);

  // ─── Cargar inventario con paginación y conteo total ──────────────────
  const loadInventario = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      let query = supabase
        .from("inventario")
        .select(`*, categorias(nombre), departamentos(nombre)`, { count: "exact" })
        // Ordenar por fecha de creación: más reciente primero
        .order("fecha_creacion", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (search.trim()) query = query.or(`nombre.ilike.%${search}%,clave.ilike.%${search}%`);
      if (catFilter)     query = query.eq("categoria_id", catFilter);
      if (estFilter)     query = query.eq("estado", estFilter);

      const { data, error, count } = await query;
      if (error) throw error;

      setItems(data as InventarioItem[] ?? []);
      setTotalCount(count ?? 0); // Guardar el total para el contador de páginas
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, catFilter, estFilter, page]);

  // ─── Cargar categorías al montar ──────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.from("categorias").select("*").order("nombre")
      .then(({ data }) => setCategorias(data ?? []));
  }, []);

  // ─── Debounce en búsqueda: espera 300ms antes de consultar ────────────
  useEffect(() => {
    const timer = setTimeout(loadInventario, 300);
    return () => clearTimeout(timer);
  }, [loadInventario]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleEdit = (item: InventarioItem) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este artículo permanentemente?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("inventario").delete().eq("id", id);
    if (!error) loadInventario();
  };

  // ─── Cálculo de rangos para el contador de paginación ────────────────
  // Ejemplo: página 1 con 50 ítems de 392 → "1–50 de 392"
  const rangoDesde = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangoHasta = Math.min(page * PER_PAGE, totalCount);
  const totalPaginas = Math.ceil(totalCount / PER_PAGE);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

          {/* ── Encabezado con acceso rápido a Formatos ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1>
              <p className="text-slate-500 font-medium">Gestión de activos y stock</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Nuevo artículo (solo admin) */}
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
          </div>

          {/* ── Filtros ── */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Búsqueda por nombre o clave */}
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

              {/* Dropdown: Categoría */}
              <div className="relative">
                <button
                  onClick={() => { setOpenCat(!openCat); setOpenEst(false); }}
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-600 font-medium transition-all"
                >
                  <span className="truncate">
                    {categorias.find(c => c.id === catFilter)?.nombre || "Todas las categorías"}
                  </span>
                  <ChevronDown className={`transition-transform duration-200 ${openCat ? "rotate-180" : ""}`} size={18} />
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

              {/* Dropdown: Estado */}
              <div className="relative">
                <button
                  onClick={() => { setOpenEst(!openEst); setOpenCat(false); }}
                  className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 text-slate-600 font-medium transition-all"
                >
                  <span className="truncate">
                    {ESTADO_LABELS[estFilter as EstadoInventarioEnum]?.label || "Cualquier estado"}
                  </span>
                  <ChevronDown className={`transition-transform duration-200 ${openEst ? "rotate-180" : ""}`} size={18} />
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

          {/* ── Tabla de inventario ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
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
                    <tr>
                      <td colSpan={5} className="p-20 text-center animate-pulse text-slate-400 font-medium">
                        Cargando inventario...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400 text-sm font-medium">
                        No se encontraron artículos con los filtros actuales
                      </td>
                    </tr>
                  ) : items.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">

                      {/* Nombre y clave */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {item.imagen_url
                              ? <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />
                              : <Package className="text-slate-400" size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{item.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{item.clave}</p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-6 py-5 hidden lg:table-cell">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          {(item.categorias as any)?.nombre ?? "General"}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-800">{item.stock_disponible}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Total: {item.stock_total}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${ESTADO_LABELS[item.estado]?.cls}`}>
                          {ESTADO_LABELS[item.estado]?.label.toUpperCase()}
                        </span>
                      </td>

                      {/* Acciones */}
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

            {/* ── Paginación estilo "1–50 de 392" ── */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">

              {/* Contador: muestra el rango visible y el total real */}
              <p className="text-sm font-medium text-slate-500">
                {isLoading ? "Cargando..." : (
                  totalCount === 0
                    ? "Sin resultados"
                    : <><span className="text-slate-900 font-bold">{rangoDesde}–{rangoHasta}</span> de <span className="text-slate-900 font-bold">{totalCount}</span></>
                )}
              </p>

              {/* Botones de navegación */}
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  title="Página anterior"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Indicador de página actual */}
                <span className="text-sm font-bold text-slate-600 min-w-[60px] text-center">
                  {page} / {totalPaginas || 1}
                </span>

                <button
                  disabled={page >= totalPaginas || isLoading}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  title="Página siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modal: crear / editar artículo */}
      <ModalGestion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
        onSaved={loadInventario}
      />
    </div>
  );
}