/**
 * @file app/prestamos/page.tsx
 * @description Gestión de préstamos: listado, filtros, creación y devolución.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalPrestamo from "@/components/ModalPrestamo";
import ModalDevolucion from "@/components/ModalDevolucion";
import type { Prestamo, EstadoPrestamoEnum } from "@/lib/supabase";
import {
  RefreshCw,
  Plus,
  Search,
  Eye,
  CornerDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

const ESTADO_LABELS: Record<
  EstadoPrestamoEnum,
  { label: string; cls: string }
> = {
  activo: { label: "Activo", cls: "bg-blue-50 text-blue-700 border-blue-100" },
  devuelto: {
    label: "Devuelto",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  atrasado: { label: "Atrasado", cls: "bg-red-50 text-red-700 border-red-100" },
  cancelado: {
    label: "Cancelado",
    cls: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

const ESTADO_ICONS: Record<EstadoPrestamoEnum, React.ReactNode> = {
  activo: <RefreshCw size={12} />,
  devuelto: <CheckCircle2 size={12} />,
  atrasado: <AlertCircle size={12} />,
  cancelado: <XCircle size={12} />,
};

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estFilter, setEstFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<any | null>(null);
  const [modalDevolucion, setModalDevolucion] = useState(false);
  const PER_PAGE = 12;

  const loadPrestamos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      let query = supabase
        .from("prestamos")
        .select(
          `
          *,
            usuarios!prestamos_usuario_id_fkey(nombre_completo),
            departamentos!prestamos_departamento_id_fkey(nombre),
            detalle_prestamo(
            id, cantidad, cantidad_devuelta, estado,
          inventario:inventario_id!detalle_prestamo_inventario_id_fkey(nombre, clave)
             )
              `,
        )

        .order("created_at", { ascending: false })
        .range((Number(page) - 1) * PER_PAGE, Number(page) * PER_PAGE - 1);

      if (estFilter) query = query.eq("estado", estFilter);

      const { data, error } = await query;
      if (error) throw error;
      setPrestamos(data ?? []);
    } catch (err) {
      console.error("Error cargando préstamos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [estFilter, page]);

  useEffect(() => {
    loadPrestamos();
  }, [loadPrestamos]);

  const filtered = prestamos.filter((p) => {
    const term = search.toLowerCase();
    const usuario = p.usuarios?.nombre_completo?.toLowerCase() ?? "";
    const depto = p.departamentos?.nombre?.toLowerCase() ?? "";
    const externo = p.solicitante_externo?.toLowerCase() ?? "";
    return (
      !term ||
      usuario.includes(term) ||
      depto.includes(term) ||
      externo.includes(term)
    );
  });

  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const handleDevolver = (p: any) => {
    setSelectedPrestamo(p);
    setModalDevolucion(true);
  };

  const handleVer = (p: any) => {
    setSelectedPrestamo(p);
    setModalNuevo(true);
  };

  // Stats
  const activos = prestamos.filter((p) => p.estado === "activo").length;
  const atrasados = prestamos.filter((p) => p.estado === "atrasado").length;
  const devueltos = prestamos.filter((p) => p.estado === "devuelto").length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Préstamos
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Control de equipos y herramientas prestadas
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPrestamo(null);
                setModalNuevo(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              <Plus size={18} /> Nuevo Préstamo
            </button>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Activos",
                val: activos,
                cls: "text-blue-600 bg-blue-50",
                border: "border-blue-100",
              },
              {
                label: "Atrasados",
                val: atrasados,
                cls: "text-red-600 bg-red-50",
                border: "border-red-100",
              },
              {
                label: "Devueltos",
                val: devueltos,
                cls: "text-emerald-600 bg-emerald-50",
                border: "border-emerald-100",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`bg-white rounded-2xl border ${s.border} shadow-sm p-4 flex flex-col items-center`}
              >
                <span className={`text-2xl font-black ${s.cls.split(" ")[0]}`}>
                  {s.val}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por solicitante o departamento..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <select
              value={estFilter}
              onChange={(e) => {
                setEstFilter(e.target.value);
                setPage(1);
              }}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Solicitante
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">
                      Departamento
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">
                      Artículos
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      Estado
                    </th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-6 py-5">
                          <div className="h-5 bg-slate-100 rounded-lg animate-pulse w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center text-slate-400 text-sm font-medium"
                      >
                        No hay préstamos registrados
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-sm">
                            {p.usuarios?.nombre_completo ??
                              p.solicitante_externo ??
                              "—"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            #{p.id}
                          </p>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-sm text-slate-600">
                          {p.departamentos?.nombre ?? "—"}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                            {p.detalle_prestamo?.length ?? 0} artículo(s)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formatFecha(p.fecha_salida)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.cls}`}
                          >
                            {ESTADO_ICONS[p.estado as EstadoPrestamoEnum]}
                            {
                              ESTADO_LABELS[p.estado as EstadoPrestamoEnum]
                                ?.label
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleVer(p)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              title="Ver detalle"
                            >
                              <Eye size={16} />
                            </button>
                            {p.estado === "activo" && (
                              <button
                                onClick={() => handleDevolver(p)}
                                className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                title="Registrar devolución"
                              >
                                <CornerDownLeft size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Mostrando{" "}
                <span className="text-slate-900 font-bold">
                  {filtered.length}
                </span>{" "}
                préstamos
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Number(p) + 1)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  Anterior
                </button>
                <button
                  disabled={prestamos.length < PER_PAGE}
                  onClick={() => setPage((p) => Number(p) + 1)}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal nuevo / ver */}
      <ModalPrestamo
        isOpen={modalNuevo}
        onClose={() => {
          setModalNuevo(false);
          setSelectedPrestamo(null);
        }}
        prestamo={selectedPrestamo}
        onSaved={loadPrestamos}
      />

      {/* Modal devolución */}
      <ModalDevolucion
        isOpen={modalDevolucion}
        onClose={() => {
          setModalDevolucion(false);
          setSelectedPrestamo(null);
        }}
        prestamo={selectedPrestamo}
        onSaved={loadPrestamos}
      />
    </div>
  );
}
