/**
 * @file app/prestamos/page.tsx
 * @description Módulo de préstamos/salidas de material.
 * Permite crear nuevas salidas mediante un modal con formulario completo,
 * buscar por fecha o nombre de herramienta, y ver el estado de cada préstamo.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Prestamo,
  Usuario,
  Departamento,
  InventarioItem,
  EstadoPrestamoEnum,
} from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Colores de estado de préstamo
// ---------------------------------------------------------------------------
const ESTADO_PRESTAMO: Record<EstadoPrestamoEnum, { label: string; cls: string }> = {
  activo:    { label: "Activo",    cls: "bg-blue-100 text-blue-700" },
  devuelto:  { label: "Devuelto",  cls: "bg-emerald-100 text-emerald-700" },
  atrasado:  { label: "Atrasado",  cls: "bg-red-100 text-red-700" },
  cancelado: { label: "Cancelado", cls: "bg-gray-100 text-gray-600" },
};

// ---------------------------------------------------------------------------
// Tipo para los ítems dentro del modal (formulario)
// ---------------------------------------------------------------------------
interface ItemSalida {
  inventario_id: number;
  nombre: string;
  clave: string;
  cantidad: number;
  stock_disponible: number;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function PrestamosPage() {
  const [prestamos, setPrestamos]     = useState<Prestamo[]>([]);
  const [usuarios, setUsuarios]       = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [inventario, setInventario]   = useState<InventarioItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);

  // Búsqueda
  const [search, setSearch]           = useState("");
  const [dateFilter, setDateFilter]   = useState("");

  // Estado del modal
  const [modalOpen, setModalOpen]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [modalError, setModalError]   = useState<string | null>(null);

  // Formulario de nueva salida
  const [form, setForm] = useState({
    usuario_id:     "",
    departamento_id: "",
    fecha_devolucion: "",
    observaciones:  "",
  });
  const [itemsSalida, setItemsSalida] = useState<ItemSalida[]>([]);
  const [busquedaItem, setBusquedaItem] = useState("");
  const [itemsResultados, setItemsResultados] = useState<InventarioItem[]>([]);

  // -------------------------------------------------------------------------
  // Cargar préstamos con filtros
  // -------------------------------------------------------------------------
  const loadPrestamos = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("prestamos")
        .select(`
          *,
          usuarios!prestamos_usuario_id_fkey (nombre_completo),
          departamentos (nombre),
          detalle_prestamo (
            id, cantidad, cantidad_devuelta, estado,
            inventario (nombre, clave)
          )
        `)
        .order("created_at", { ascending: false });

      // Filtro por fecha
      if (dateFilter) {
        const inicio = new Date(dateFilter);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(dateFilter);
        fin.setHours(23, 59, 59, 999);
        query = query
          .gte("fecha_salida", inicio.toISOString())
          .lte("fecha_salida", fin.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data as Prestamo[]) ?? [];

      // Filtro por nombre de herramienta (en cliente)
      if (search.trim()) {
        const s = search.toLowerCase();
        result = result.filter((p) =>
          p.detalle_prestamo?.some((d) =>
            (d.inventario as any)?.nombre?.toLowerCase().includes(s) ||
            (d.inventario as any)?.clave?.toLowerCase().includes(s)
          ) ||
          (p.usuarios as any)?.nombre_completo?.toLowerCase().includes(s)
        );
      }

      setPrestamos(result);
    } catch (err) {
      console.error("Error cargando préstamos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, dateFilter]);

  // Cargar catálogos una vez
  useEffect(() => {
    Promise.all([
      supabase.from("usuarios").select("*").order("nombre_completo"),
      supabase.from("departamentos").select("*").order("nombre"),
      supabase.from("inventario")
        .select("id, nombre, clave, stock_disponible, unidad_medida")
        .eq("estado", "activo")
        .gt("stock_disponible", 0)
        .order("nombre"),
    ]).then(([{ data: u }, { data: d }, { data: inv }]) => {
      setUsuarios(u ?? []);
      setDepartamentos(d ?? []);
      setInventario(inv as InventarioItem[] ?? []);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(loadPrestamos, 300);
    return () => clearTimeout(t);
  }, [loadPrestamos]);

  // -------------------------------------------------------------------------
  // Búsqueda de artículos dentro del modal
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!busquedaItem.trim()) {
      setItemsResultados([]);
      return;
    }
    const filtrados = inventario.filter((inv) =>
      inv.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) ||
      inv.clave.toLowerCase().includes(busquedaItem.toLowerCase())
    );
    setItemsResultados(filtrados.slice(0, 6));
  }, [busquedaItem, inventario]);

  // -------------------------------------------------------------------------
  // Agregar artículo a la lista de salida
  // -------------------------------------------------------------------------
  const agregarItem = (inv: InventarioItem) => {
    const yaExiste = itemsSalida.find((i) => i.inventario_id === inv.id);
    if (yaExiste) return;
    setItemsSalida((prev) => [
      ...prev,
      {
        inventario_id:    inv.id,
        nombre:           inv.nombre,
        clave:            inv.clave,
        cantidad:         1,
        stock_disponible: inv.stock_disponible,
      },
    ]);
    setBusquedaItem("");
    setItemsResultados([]);
  };

  /** Cambiar cantidad de un ítem en la lista */
  const cambiarCantidad = (id: number, cantidad: number) => {
    setItemsSalida((prev) =>
      prev.map((i) => (i.inventario_id === id ? { ...i, cantidad } : i))
    );
  };

  /** Eliminar un ítem de la lista */
  const quitarItem = (id: number) => {
    setItemsSalida((prev) => prev.filter((i) => i.inventario_id !== id));
  };

  // -------------------------------------------------------------------------
  // Guardar nueva salida
  // -------------------------------------------------------------------------
  const handleGuardar = async () => {
    setModalError(null);

    if (!form.usuario_id) {
      setModalError("Selecciona el usuario que recibe el material.");
      return;
    }
    if (itemsSalida.length === 0) {
      setModalError("Agrega al menos un artículo a la salida.");
      return;
    }

    // Validar cantidades
    for (const item of itemsSalida) {
      if (item.cantidad <= 0) {
        setModalError(`La cantidad de "${item.nombre}" debe ser mayor a 0.`);
        return;
      }
      if (item.cantidad > item.stock_disponible) {
        setModalError(`No hay suficiente stock de "${item.nombre}".`);
        return;
      }
    }

    setSaving(true);
    try {
      // Obtener usuario logueado (creador del préstamo)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión activa");

      // 1. Crear cabecera del préstamo
      const { data: nuevoPrestamo, error: errPrestamo } = await supabase
        .from("prestamos")
        .insert({
          usuario_id:       form.usuario_id,
          departamento_id:  form.departamento_id || null,
          created_by:       user.id,
          fecha_salida:     new Date().toISOString(),
          fecha_devolucion: form.fecha_devolucion || null,
          estado:           "activo",
          observaciones:    form.observaciones || null,
        })
        .select("id")
        .single();

      if (errPrestamo) throw new Error(errPrestamo.message);

      const prestamoId = nuevoPrestamo.id;

      // 2. Insertar detalle de cada ítem
      const detalles = itemsSalida.map((i) => ({
        prestamo_id:    prestamoId,
        inventario_id:  i.inventario_id,
        cantidad:       i.cantidad,
        cantidad_devuelta: 0,
        estado:         "pendiente",
      }));

      const { error: errDetalle } = await supabase
        .from("detalle_prestamo")
        .insert(detalles);

      if (errDetalle) throw new Error(errDetalle.message);

      // 3. Actualizar stock disponible de cada artículo
      for (const item of itemsSalida) {
        const nuevoStock = item.stock_disponible - item.cantidad;
        await supabase
          .from("inventario")
          .update({ stock_disponible: nuevoStock, updated_at: new Date().toISOString() })
          .eq("id", item.inventario_id);

        // 4. Registrar movimiento en historial
        await supabase.from("historial_inventario").insert({
          inventario_id:   item.inventario_id,
          usuario_id:      user.id,
          tipo_movimiento: "prestamo",
          cantidad:        item.cantidad,
          stock_antes:     item.stock_disponible,
          stock_despues:   nuevoStock,
          prestamo_id:     prestamoId,
          observaciones:   `Préstamo #${prestamoId}`,
        });
      }

      // Cerrar modal y recargar
      setModalOpen(false);
      resetForm();
      loadPrestamos();
    } catch (err: any) {
      setModalError(err.message ?? "Error inesperado al guardar");
    } finally {
      setSaving(false);
    }
  };

  /** Restablecer el formulario del modal */
  const resetForm = () => {
    setForm({ usuario_id: "", departamento_id: "", fecha_devolucion: "", observaciones: "" });
    setItemsSalida([]);
    setBusquedaItem("");
    setItemsResultados([]);
    setModalError(null);
  };

  // -------------------------------------------------------------------------
  // Formatear fecha legible
  // -------------------------------------------------------------------------
  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
    });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Préstamos / Salidas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control de material prestado a usuarios y departamentos</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          + Nueva salida
        </button>
      </div>

      {/* Filtros de búsqueda */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por herramienta o usuario..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
          {(search || dateFilter) && (
            <button
              onClick={() => { setSearch(""); setDateFilter(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de préstamos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Artículos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Fecha salida</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Devolución</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : prestamos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    No se encontraron préstamos
                  </td>
                </tr>
              ) : (
                prestamos.map((p) => {
                  const estado = ESTADO_PRESTAMO[p.estado];
                  const articulos = p.detalle_prestamo?.map(
                    (d) => (d.inventario as any)?.nombre ?? "—"
                  ).join(", ");

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-gray-500 text-xs">#{p.id}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{(p.usuarios as any)?.nombre_completo ?? "—"}</p>
                        <p className="text-xs text-gray-400">{(p.departamentos as any)?.nombre ?? "Sin depto."}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-600 max-w-xs truncate hidden sm:table-cell">
                        {articulos ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-gray-600 hidden md:table-cell">{fmtFecha(p.fecha_salida)}</td>
                      <td className="px-4 py-4 text-gray-600 hidden md:table-cell">
                        {p.fecha_devolucion ? fmtFecha(p.fecha_devolucion) : "—"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estado.cls}`}>
                          {estado.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Modal: Nueva salida                                                 */}
      {/* ================================================================== */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Nueva salida de material</h2>
              <button
                onClick={() => { setModalOpen(false); resetForm(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo del modal */}
            <div className="px-6 py-5 space-y-5">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {modalError}
                </div>
              )}

              {/* Usuario receptor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Usuario que recibe <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.usuario_id}
                    onChange={(e) => setForm((f) => ({ ...f, usuario_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecciona usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre_completo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Departamento</label>
                  <select
                    value={form.departamento_id}
                    onChange={(e) => setForm((f) => ({ ...f, departamento_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Sin asignar</option>
                    {departamentos.map((d) => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha de devolución y observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha estimada de devolución</label>
                  <input
                    type="date"
                    value={form.fecha_devolucion}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_devolucion: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Observaciones</label>
                  <input
                    type="text"
                    value={form.observaciones}
                    onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Ej: Solicitud de trabajo #12"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Buscador de artículos */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Agregar artículos <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={busquedaItem}
                    onChange={(e) => setBusquedaItem(e.target.value)}
                    placeholder="Buscar herramienta o material..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Resultados del buscador */}
                  {itemsResultados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                      {itemsResultados.map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => agregarItem(inv)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{inv.nombre}</p>
                            <p className="text-xs text-gray-400">{inv.clave}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {inv.stock_disponible} disponibles
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de artículos agregados */}
              {itemsSalida.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                    Artículos en esta salida
                  </div>
                  <div className="divide-y divide-gray-100">
                    {itemsSalida.map((item) => (
                      <div key={item.inventario_id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                          <p className="text-xs text-gray-400">{item.clave} · máx. {item.stock_disponible}</p>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={item.stock_disponible}
                          value={item.cantidad}
                          onChange={(e) => cambiarCantidad(item.inventario_id, Number(e.target.value))}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => quitarItem(item.inventario_id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {saving ? "Registrando..." : "Registrar salida"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}