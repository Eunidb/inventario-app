/**
 * @file app/historial/page.tsx
 * @description Historial de auditoría limpio, responsivo y optimizado con ModalConfirmar.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalConfirmar from "@/components/ModalConfirmar";

import {
  Search,
  Filter,
  Download,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

const TIPO_CONFIG: Record<
  string,
  {
    label: string;
    cls: string;
    signo: string;
  }
> = {
  entrada: {
    label: "Entrada",
    cls: "bg-[#014ba0] text-white border border-[#013b82]",
    signo: "+",
  },
  salida: {
    label: "Salida",
    cls: "bg-blue-600 text-white border border-blue-700",
    signo: "−",
  },
  prestamo: {
    label: "Préstamo",
    cls: "bg-indigo-600 text-white border border-indigo-700",
    signo: "−",
  },
  devolucion: {
    label: "Devolución",
    cls: "bg-cyan-600 text-white border border-cyan-700",
    signo: "+",
  },
  ajuste: {
    label: "Ajuste",
    cls: "bg-slate-600 text-white border border-slate-700",
    signo: "~",
  },
  baja: {
    label: "Baja",
    cls: "bg-slate-900 text-white border border-slate-950",
    signo: "−",
  },
};

// Instancia única del formateador para evitar lentitud en la tabla
const DateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function HistorialPage() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedMovimiento, setSelectedMovimiento] = useState<any | null>(null);
  const [modalType, setModalType] = useState<"ver" | "editar" | "eliminar" | null>(null);
  const [editObservaciones, setEditObservaciones] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const PER_PAGE = 20;

  const loadHistorial = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      let q = supabase
        .from("historial_inventario")
        .select(
          `
            *,
            inventario(nombre, clave),
            usuarios(nombre_completo)
          `,
        )
        .order("fecha", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (tipoFilter) {
        q = q.eq("tipo_movimiento", tipoFilter);
      }

      if (fechaDesde) {
        q = q.gte("fecha", fechaDesde);
      }

      if (fechaHasta) {
        q = q.lte("fecha", fechaHasta + "T23:59:59");
      }

      const { data, error } = await q;
      if (error) throw error;

      setHistorial(data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [tipoFilter, fechaDesde, fechaHasta, page]);

  useEffect(() => {
    loadHistorial();
  }, [loadHistorial]);

  const filtered = historial.filter((m) => {
    const term = search.toLowerCase();
    return (
      !term ||
      m.inventario?.nombre?.toLowerCase().includes(term) ||
      m.inventario?.clave?.toLowerCase().includes(term) ||
      m.usuarios?.nombre_completo?.toLowerCase().includes(term)
    );
  });

  const formatFecha = (f: string) => DateFormatter.format(new Date(f));

  const closeModal = () => {
    setSelectedMovimiento(null);
    setModalType(null);
    setEditObservaciones("");
  };

  const openModal = (movimiento: any, type: "ver" | "editar" | "eliminar") => {
    setSelectedMovimiento(movimiento);
    setModalType(type);

    if (type === "editar") {
      setEditObservaciones(movimiento.observaciones ?? "");
    }
  };

  const handleUpdateObservaciones = async () => {
    if (!selectedMovimiento) return;
    setIsActionLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("historial_inventario")
        .update({ observaciones: editObservaciones })
        .eq("id", selectedMovimiento.id);

      if (error) throw error;

      setHistorial((prev) =>
        prev.map((m) =>
          m.id === selectedMovimiento.id
            ? { ...m, observaciones: editObservaciones }
            : m,
        ),
      );
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteRegistro = async () => {
  if (!selectedMovimiento) return;
  setIsActionLoading(true);
 const supabase = createClient();
  try {
    const { error } = await supabase
      .from("historial_inventario")
      .delete()
      .eq("id", selectedMovimiento.id);

    if (error) throw error;

    // Actualiza la UI
    setHistorial((prev) => prev.filter((m) => m.id !== selectedMovimiento.id));
    closeModal();
    // Opcional: mostrar un toast de éxito aquí
  } catch (error) {
    console.error("Error al eliminar:", error);
    alert("No se pudo eliminar el registro. Verifica que no tenga dependencias.");
  } finally {
    setIsActionLoading(false);
  }
}

  const exportarCSV = () => {
    const headers = [
      "ID", "Artículo", "Clave", "Tipo", "Cantidad",
      "Stock Antes", "Stock Después", "Usuario", "Fecha", "Observaciones"
    ];

    const rows = filtered.map((m) => [
      m.id,
      m.inventario?.nombre ?? "",
      m.inventario?.clave ?? "",
      m.tipo_movimiento,
      m.cantidad,
      m.stock_antes ?? "",
      m.stock_despues ?? "",
      m.usuarios?.nombre_completo ?? "",
      new Date(m.fecha).toLocaleString("es-MX"),
      m.observaciones ?? "",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 w-full lg:pl-64 overflow-hidden">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-5 md:px-8 lg:px-10 pt-24 lg:pt-10 pb-8 flex flex-col min-w-0">
          
          {/* HEADER */}
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-7">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Historial
              </h1>
              <p className="text-slate-500 font-medium text-sm mt-2">
                Auditoría integral de movimientos registrados en el sistema.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <button
                onClick={() => setShowFilters((f) => !f)}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-all duration-200 ${
                  showFilters
                    ? "bg-[#014ba0] text-white border-[#014ba0]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-[#014ba0] hover:text-[#014ba0]"
                }`}
              >
                <Filter size={16} />
                Filtros
              </button>

              <button
                onClick={exportarCSV}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border border-slate-200 bg-white text-slate-700 hover:border-[#014ba0] hover:text-[#014ba0] transition-all"
              >
                <Download size={16} />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* FILTROS */}
          {showFilters && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm mb-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar artículo, clave o usuario..."
                    className="w-full min-h-[48px] pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
                  />
                </div>

                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="min-h-[48px] px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0] w-full"
                >
                  <option value="">Todos los tipos</option>
                  {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="min-h-[48px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full outline-none focus:border-[#014ba0]"
                  />
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="min-h-[48px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full outline-none focus:border-[#014ba0]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TABLA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-full">
            <div className="w-full overflow-x-auto block whitespace-nowrap scrolling-touch">
              <table className="min-w-[950px] w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#014ba0] to-[#004091]">
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-white">Artículo</th>
                    <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white">Tipo</th>
                    <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white">Cantidad</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-white">Stock</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-white">Usuario</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-white">Fecha</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-white">Observaciones</th>
                    <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="p-4">
                          <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-sm font-semibold">
                        No se encontraron registros.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => {
                      const cfg = TIPO_CONFIG[m.tipo_movimiento] ?? TIPO_CONFIG.ajuste;

                      return (
                        <tr key={m.id} className="hover:bg-[#014ba0]/5 text-slate-700 transition-all even:bg-slate-50/30">
                          <td className="px-4 py-2 align-middle">
                            <p className="text-xs font-bold text-slate-800 whitespace-normal line-clamp-1">
                              {m.inventario?.nombre ?? "—"}
                            </p>
                            <p className="text-[10px] font-mono text-[#014ba0] mt-0.5">
                              {m.inventario?.clave}
                            </p>
                          </td>

                          <td className="px-4 py-2 text-center align-middle">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm inline-block ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          </td>

                          <td className="px-4 py-2 text-center font-bold text-xs text-slate-800 align-middle">
                            {cfg.signo}{m.cantidad}
                          </td>

                          <td className="px-4 py-2 text-xs align-middle">
                            <span className="text-slate-500">{m.stock_antes}</span> →{" "}
                            <span className="font-bold text-[#014ba0]">{m.stock_despues}</span>
                          </td>

                          <td className="px-4 py-2 text-xs font-medium align-middle whitespace-normal max-w-[150px] truncate">
                            {m.usuarios?.nombre_completo ?? "—"}
                          </td>

                          <td className="px-4 py-2 text-[11px] text-slate-500 align-middle whitespace-nowrap">
                            {formatFecha(m.fecha)}
                          </td>

                          <td className="px-4 py-2 text-xs text-slate-500 max-w-[200px] truncate align-middle whitespace-normal">
                            {m.observaciones || "Sin observaciones"}
                          </td>

                          <td className="px-4 py-2 align-middle">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openModal(m, "ver")}
                                className="p-1.5 rounded-lg text-[#014ba0] hover:bg-[#014ba0]/10 transition-all"
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                onClick={() => openModal(m, "editar")}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                onClick={() => openModal(m, "eliminar")}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
              <p className="text-xs text-slate-500 font-semibold text-center sm:text-left">
                Registros mostrados: <span className="text-slate-900">{filtered.length}</span>
              </p>

              <div className="flex gap-2 justify-center w-full sm:w-auto">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#014ba0] disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={14} />
                  Anterior
                </button>

                <button
                  disabled={historial.length < PER_PAGE}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#014ba0] text-white text-xs font-semibold disabled:opacity-40 transition-all"
                >
                  Siguiente
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* RENDERIZADO CONTROLADO DE MODALES */}
      {modalType && selectedMovimiento && (
        <>
          {/* FLUJO REUTILIZABLE PARA ELIMINACIONES */}
          {modalType === "eliminar" ? (
            <ModalConfirmar
              isOpen={modalType === "eliminar"}
              onClose={closeModal}
              onConfirm={handleDeleteRegistro}
              titulo="¿Eliminar Registro?"
              mensaje={`Esta acción eliminará de forma permanente el movimiento del artículo "${selectedMovimiento.inventario?.nombre}". ¿Deseas continuar?`}
              tipo="delete"
            />
          ) : (
            /* FLUJO CONVENCIONAL PARA VER / EDITAR */
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

              <div className="relative bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-black text-[#014ba0] flex items-center gap-2">
                    {modalType === "ver" && (
                      <>
                        <Info size={20} />
                        Detalles del Registro
                      </>
                    )}
                    {modalType === "editar" && (
                      <>
                        <Pencil size={20} />
                        Editar Observaciones
                      </>
                    )}
                  </h2>

                  <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </div>

                {/* CONTENIDO: VER */}
                {modalType === "ver" && (
                  <div className="p-6 space-y-5">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <h3 className="font-black text-slate-900 text-lg">
                        {selectedMovimiento.inventario?.nombre}
                      </h3>
                      <p className="text-[#014ba0] font-mono text-sm mt-1">
                        {selectedMovimiento.inventario?.clave}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <p className="text-xs uppercase font-bold text-slate-400">Tipo</p>
                        <div className="mt-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-block ${TIPO_CONFIG[selectedMovimiento.tipo_movimiento]?.cls}`}>
                            {TIPO_CONFIG[selectedMovimiento.tipo_movimiento]?.label}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <p className="text-xs uppercase font-bold text-slate-400">Cantidad</p>
                        <p className="mt-2 font-black text-xl text-slate-800">{selectedMovimiento.cantidad}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                      <p className="text-xs uppercase font-bold text-slate-400">Observaciones</p>
                      <p className="mt-2 text-slate-700">{selectedMovimiento.observaciones || "Sin observaciones"}</p>
                    </div>

                    <button
                      onClick={closeModal}
                      className="w-full min-h-[48px] bg-[#014ba0] hover:bg-[#013b82] text-white rounded-xl font-bold transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                )}

                {/* CONTENIDO: EDITAR */}
                {modalType === "editar" && (
                  <div className="p-6 space-y-5">
                    <textarea
                      rows={5}
                      value={editObservaciones}
                      onChange={(e) => setEditObservaciones(e.target.value)}
                      placeholder="Actualizar observaciones..."
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 resize-none outline-none focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
                    />

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        onClick={closeModal}
                        className="min-h-[48px] px-5 rounded-xl border border-slate-200 font-semibold"
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={handleUpdateObservaciones}
                        disabled={isActionLoading}
                        className="min-h-[48px] px-5 rounded-xl bg-[#014ba0] hover:bg-[#013b82] text-white font-bold"
                      >
                        {isActionLoading ? "Guardando..." : "Guardar Cambios"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}