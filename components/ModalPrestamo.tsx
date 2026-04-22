/**
 * @file components/ModalPrestamo.tsx
 * @description Modal para crear un nuevo préstamo o ver el detalle de uno existente.
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { X, Plus, Trash2, Loader2, RefreshCw, Package } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prestamo?: any | null;  // null = crear nuevo, objeto = ver detalle
  onSaved: () => void;
}

interface LineaPrestamo {
  inventario_id: string;
  nombre: string;
  clave: string;
  stock_disponible: number;
  cantidad: number;
}

export default function ModalPrestamo({ isOpen, onClose, prestamo, onSaved }: Props) {
  const isView = !!prestamo;
  const supabase = createClient();

  const [loading, setLoading]       = useState(false);
  const [usuarios, setUsuarios]     = useState<any[]>([]);
  const [deptos, setDeptos]         = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [search, setSearch]         = useState("");
  const [buscando, setBuscando]     = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);

  const [form, setForm] = useState({
    usuario_id: "",
    solicitante_externo: "",
    departamento_id: "",
    observaciones: "",
    tipoSolicitante: "interno" as "interno" | "externo",
  });
  const [lineas, setLineas] = useState<LineaPrestamo[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const loadCatalogos = async () => {
      const [{ data: u }, { data: d }] = await Promise.all([
        supabase.from("usuarios").select("id, nombre_completo").order("nombre_completo"),
        supabase.from("departamentos").select("id, nombre").order("nombre"),
      ]);
      setUsuarios(u ?? []);
      setDeptos(d ?? []);
    };
    loadCatalogos();
  }, [isOpen]);

  // Buscar artículos para agregar
  useEffect(() => {
    if (!search.trim() || isView) { setResultados([]); return; }
    const timer = setTimeout(async () => {
      setBuscando(true);
      const { data } = await supabase
        .from("inventario")
        .select("id, clave, nombre, stock_disponible")
        .eq("estado", "activo")
        .gt("stock_disponible", 0)
        .or(`nombre.ilike.%${search}%,clave.ilike.%${search}%`)
        .limit(8);
      setResultados(data ?? []);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const agregarLinea = (item: any) => {
    if (lineas.find(l => l.inventario_id === String(item.id))) return;
    setLineas(prev => [...prev, {
      inventario_id: String(item.id),
      nombre: item.nombre,
      clave: item.clave,
      stock_disponible: item.stock_disponible,
      cantidad: 1,
    }]);
    setSearch("");
    setResultados([]);
  };

  const quitarLinea = (id: string) => setLineas(prev => prev.filter(l => l.inventario_id !== id));

  const updateCantidad = (id: string, val: number) => {
    setLineas(prev => prev.map(l =>
      l.inventario_id === id ? { ...l, cantidad: Math.min(Math.max(1, val), l.stock_disponible) } : l
    ));
  };

  const handleSubmit = async () => {
    if (lineas.length === 0) { alert("Agrega al menos un artículo."); return; }
    const solicitante = form.tipoSolicitante === "interno" ? form.usuario_id : null;
    const externo = form.tipoSolicitante === "externo" ? form.solicitante_externo.trim() : null;
    if (!solicitante && !externo) { alert("Ingresa un solicitante."); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Crear préstamo cabecera
    const { data: nuevoPrestamo, error: errPrestamo } = await supabase
      .from("prestamos")
      .insert({
        usuario_id: solicitante,
        solicitante_externo: externo,
        departamento_id: form.departamento_id || null,
        autorizado_por: user!.id, 
    registrado_por: user!.id,
        observaciones: form.observaciones || null,
        estado: "activo",
      })
      .select()
      .single();

    if (errPrestamo) { alert("Error: " + errPrestamo.message); setLoading(false); return; }

    // 2. Insertar detalles (el trigger descontará el stock)
    const detalles = lineas.map(l => ({
      prestamo_id: nuevoPrestamo.id,
      inventario_id: parseInt(l.inventario_id),
      cantidad: l.cantidad,
    }));

    const { error: errDetalle } = await supabase.from("detalle_prestamo").insert(detalles);

    if (errDetalle) {
      // Revertir si falla
      await supabase.from("prestamos").delete().eq("id", nuevoPrestamo.id);
      alert("Error al guardar detalles: " + errDetalle.message);
      setLoading(false);
      return;
    }

    // 3. Registrar en historial
    const historial = lineas.map(l => ({
      inventario_id: parseInt(l.inventario_id),
      usuario_id: user!.id,
      tipo_movimiento: "prestamo",
      cantidad: l.cantidad,
      prestamo_id: nuevoPrestamo.id,
      observaciones: `Préstamo #${nuevoPrestamo.id}`,
    }));
    await supabase.from("historial_inventario").insert(historial);

    setLoading(false);
    onSaved();
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setForm({ usuario_id: "", solicitante_externo: "", departamento_id: "", observaciones: "", tipoSolicitante: "interno" });
    setLineas([]);
    setSearch("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {isView ? `Préstamo #${prestamo.id}` : "Nuevo Préstamo"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isView ? "Detalle del préstamo" : "Registra un préstamo de equipo o herramienta"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-7 space-y-6">
          {isView ? (
            /* ── MODO VER ── */
            <ViewPrestamo prestamo={prestamo} />
          ) : (
            /* ── MODO CREAR ── */
            <>
              {/* Tipo de solicitante */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tipo de solicitante</label>
                <div className="flex gap-2">
                  {(["interno", "externo"] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, tipoSolicitante: t }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${form.tipoSolicitante === t ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300"}`}>
                      {t === "interno" ? "👤 Usuario interno" : "🌐 Externo"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solicitante */}
              {form.tipoSolicitante === "interno" ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Usuario</label>
                  <select value={form.usuario_id} onChange={e => setForm(f => ({ ...f, usuario_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">Seleccionar usuario...</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Nombre del solicitante</label>
                  <input value={form.solicitante_externo} onChange={e => setForm(f => ({ ...f, solicitante_externo: e.target.value }))}
                    placeholder="Nombre y apellido"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Departamento</label>
                  <select value={form.departamento_id} onChange={e => setForm(f => ({ ...f, departamento_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">Sin departamento</option>
                    {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Observaciones</label>
                  <input value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Notas opcionales..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              {/* Buscador de artículos */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Artículos a prestar</label>
                <div className="relative">
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o clave..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
                  {buscando && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
                  {resultados.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 overflow-hidden">
                      {resultados.map(r => (
                        <button key={r.id} type="button" onClick={() => agregarLinea(r)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{r.nombre}</p>
                            <p className="text-[11px] font-mono text-slate-400">{r.clave}</p>
                          </div>
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{r.stock_disponible} disp.</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Líneas seleccionadas */}
              {lineas.length > 0 && (
                <div className="space-y-2">
                  {lineas.map(l => (
                    <div key={l.inventario_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Package size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{l.nombre}</p>
                        <p className="text-[11px] font-mono text-slate-400">{l.clave} · Máx: {l.stock_disponible}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateCantidad(l.inventario_id, l.cantidad - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm transition-colors flex items-center justify-center">−</button>
                        <span className="w-8 text-center text-sm font-black text-slate-800">{l.cantidad}</span>
                        <button type="button" onClick={() => updateCantidad(l.inventario_id, l.cantidad + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm transition-colors flex items-center justify-center">+</button>
                      </div>
                      <button type="button" onClick={() => quitarLinea(l.inventario_id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isView && (
          <div className="px-7 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 disabled:opacity-60 transition-all">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {loading ? "Guardando..." : "Registrar Préstamo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewPrestamo({ prestamo }: { prestamo: any }) {
  const ESTADO_CLS: Record<string, string> = {
    activo: "bg-blue-50 text-blue-700 border-blue-100",
    devuelto: "bg-emerald-50 text-emerald-700 border-emerald-100",
    atrasado: "bg-red-50 text-red-700 border-red-100",
    cancelado: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <InfoField label="Solicitante" value={prestamo.usuarios?.nombre_completo ?? prestamo.solicitante_externo ?? "—"} />
        <InfoField label="Departamento" value={prestamo.departamentos?.nombre ?? "—"} />
        <InfoField label="Fecha de salida" value={new Date(prestamo.fecha_salida).toLocaleDateString("es-MX", { dateStyle: "long" })} />
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</p>
          <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold border ${ESTADO_CLS[prestamo.estado]}`}>
            {prestamo.estado.charAt(0).toUpperCase() + prestamo.estado.slice(1)}
          </span>
        </div>
      </div>
      {prestamo.observaciones && <InfoField label="Observaciones" value={prestamo.observaciones} />}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Artículos prestados</p>
        <div className="space-y-2">
          {(prestamo.detalle_prestamo ?? []).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">{d.inventario?.nombre ?? "—"}</p>
                <p className="text-[11px] font-mono text-slate-400">{d.inventario?.clave}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-700">x{d.cantidad}</p>
                <p className="text-[10px] text-slate-400">Devuelto: {d.cantidad_devuelta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}