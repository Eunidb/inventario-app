"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { X, Plus, Trash2, Loader2, RefreshCw, Package, Search } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prestamo?: any | null;
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
        .limit(6);
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

    const detalles = lineas.map(l => ({
      prestamo_id: nuevoPrestamo.id,
      inventario_id: parseInt(l.inventario_id),
      cantidad: l.cantidad,
    }));

    const { error: errDetalle } = await supabase.from("detalle_prestamo").insert(detalles);

    if (errDetalle) {
      await supabase.from("prestamos").delete().eq("id", nuevoPrestamo.id);
      alert("Error al guardar detalles: " + errDetalle.message);
      setLoading(false);
      return;
    }

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
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <RefreshCw size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">
                {isView ? `Préstamo #${prestamo.id}` : "Nuevo Préstamo"}
              </h2>
              <p className="text-xs text-slate-400">
                {isView ? "Detalle general e inventariado" : "Registro de salidas temporales de equipos"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Formulario Scrolleable responsivo */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {isView ? (
            <ViewPrestamo prestamo={prestamo} />
          ) : (
            <>
              {/* Tipo de solicitante */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de solicitante</label>
                <div className="flex gap-2">
                  {(["interno", "externo"] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, tipoSolicitante: t }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.tipoSolicitante === t ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300"}`}>
                      {t === "interno" ? "Usuario Interno" : "Externo / Tercero"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector del Solicitante */}
              {form.tipoSolicitante === "interno" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seleccionar Usuario</label>
                  <select value={form.usuario_id} onChange={e => setForm(f => ({ ...f, usuario_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer">
                    <option value="">Elegir de la lista...</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre del solicitante externo</label>
                  <input value={form.solicitante_externo} onChange={e => setForm(f => ({ ...f, solicitante_externo: e.target.value }))}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                </div>
              )}

              {/* Depto y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Departamento asignado</label>
                  <select value={form.departamento_id} onChange={e => setForm(f => ({ ...f, departamento_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer">
                    <option value="">Área general / Ninguno</option>
                    {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observaciones iniciales</label>
                  <input value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Notas o motivos..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                </div>
              </div>

              {/* Buscador de artículos predictivo */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Artículos a prestar</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Digita el nombre o número de clave..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                  {buscando && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
                </div>

                {resultados.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                    {resultados.map(r => (
                      <button key={r.id} type="button" onClick={() => agregarLinea(r)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50/70 transition-colors text-left text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{r.nombre}</p>
                          <p className="font-mono text-[10px] text-slate-400">{r.clave}</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex-shrink-0">{r.stock_disponible} disp.</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Líneas seleccionadas */}
              {lineas.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Canasta de salida</span>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {lineas.map(l => (
                      <div key={l.inventario_id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                            <Package size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{l.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400">Máx disponible: {l.stock_disponible}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm px-1 py-0.5">
                            <button type="button" onClick={() => updateCantidad(l.inventario_id, l.cantidad - 1)}
                              className="w-6 h-6 text-xs text-slate-500 hover:bg-slate-100 rounded font-bold">-</button>
                            <span className="w-6 text-center text-xs font-black text-slate-800">{l.cantidad}</span>
                            <button type="button" onClick={() => updateCantidad(l.inventario_id, l.cantidad + 1)}
                              className="w-6 h-6 text-xs text-slate-500 hover:bg-slate-100 rounded font-bold">+</button>
                          </div>
                          <button type="button" onClick={() => quitarLinea(l.inventario_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isView && (
          <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
            <button onClick={onClose} className="px-4 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-wider hover:text-slate-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-100 disabled:opacity-60 transition-all w-full sm:w-auto">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {loading ? "Creando..." : "Emitir Préstamo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewPrestamo({ prestamo }: { prestamo: any }) {
  const ESTADO_CLS: Record<string, string> = {
    activo: "bg-blue-50 text-blue-700 border-blue-200",
    devuelto: "bg-emerald-50 text-emerald-700 border-emerald-200",
    atrasado: "bg-rose-50 text-rose-700 border-rose-200",
    cancelado: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoField label="Solicitante" value={prestamo.usuarios?.nombre_completo ?? prestamo.solicitante_externo ?? "—"} />
        <InfoField label="Departamento" value={prestamo.departamentos?.nombre ?? "—"} />
        <InfoField label="Fecha de salida" value={new Date(prestamo.fecha_salida).toLocaleDateString("es-MX", { dateStyle: "long" })} />
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado actual</p>
          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${ESTADO_CLS[prestamo.estado]}`}>
            {prestamo.estado.charAt(0).toUpperCase() + prestamo.estado.slice(1)}
          </span>
        </div>
      </div>
      {prestamo.observaciones && <InfoField label="Observaciones adicionales" value={prestamo.observaciones} />}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Artículos detallados</p>
        <div className="space-y-2 max-h-[220px] overflow-y-auto">
          {(prestamo.detalle_prestamo ?? []).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
              <div>
                <p className="font-bold text-slate-800">{d.inventario?.nombre ?? "—"}</p>
                <p className="font-mono text-[10px] text-slate-400">{d.inventario?.clave}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-blue-600">x{d.cantidad}</p>
                <p className="text-[10px] text-slate-400">Devueltos: {d.cantidad_devuelta}</p>
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
    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-700 truncate">{value}</p>
    </div>
  );
}