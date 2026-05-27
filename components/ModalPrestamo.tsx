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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200 [color-scheme:light]">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-200">

        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#014ba0]/10 text-[#014ba0] rounded-xl shadow-sm">
              <RefreshCw size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {isView ? `Préstamo #${prestamo.id}` : "Nuevo Préstamo"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isView ? "Detalle general de activos en tránsito" : "Registro de salidas temporales de equipos e infraestructura"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-100 transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Formulario Scrolleable */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6 custom-scrollbar">
          {isView ? (
            <ViewPrestamo prestamo={prestamo} />
          ) : (
            <>
              {/* Segmentación de Solicitante */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tipo de Solicitante</label>
                <div className="flex gap-2.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                  {(["interno", "externo"] as const).map(t => (
                    <button 
                      key={t} 
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipoSolicitante: t }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                        form.tipoSolicitante === t 
                          ? "bg-[#014ba0] text-white shadow-sm" 
                          : "text-slate-600 hover:bg-white hover:text-[#014ba0]"
                      }`}
                    >
                      {t === "interno" ? "Usuario Interno" : "Externo / Tercero"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formularios según tipo de solicitante */}
              {form.tipoSolicitante === "interno" ? (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Seleccionar Usuario</label>
                  <select 
                    value={form.usuario_id} 
                    onChange={e => setForm(f => ({ ...f, usuario_id: e.target.value }))}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-[#014ba0]/5 focus:border-[#014ba0] transition-all cursor-pointer"
                  >
                    <option value="">Elegir colaborador de la lista...</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nombre del solicitante externo</label>
                  <input 
                    value={form.solicitante_externo} 
                    onChange={e => setForm(f => ({ ...f, solicitante_externo: e.target.value }))}
                    placeholder="Ej. Juan Pérez González"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#014ba0]/5 focus:border-[#014ba0] transition-all" 
                  />
                </div>
              )}

              {/* Departamento y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Departamento Asignado</label>
                  <select 
                    value={form.departamento_id} 
                    onChange={e => setForm(f => ({ ...f, departamento_id: e.target.value }))}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-[#014ba0]/5 focus:border-[#014ba0] transition-all cursor-pointer"
                  >
                    <option value="">Área general / Ninguno</option>
                    {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Observaciones Iniciales</label>
                  <input 
                    value={form.observaciones} 
                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Notas, motivos de salida o justificación..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#014ba0]/5 focus:border-[#014ba0] transition-all" 
                  />
                </div>
              </div>

              {/* Buscador de artículos predictivo */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Buscar Artículos a Prestar</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Escribe el nombre del activo o número de clave..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#014ba0]/5 focus:border-[#014ba0] transition-all" 
                  />
                  {buscando && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#014ba0] animate-spin" />}
                </div>

                {/* Panel de resultados predictivos */}
                {resultados.length > 0 && (
                  <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                    {resultados.map(r => (
                      <button 
                        key={r.id} 
                        type="button" 
                        onClick={() => agregarLinea(r)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="font-bold text-xs text-slate-900 truncate">{r.nombre}</p>
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{r.clave}</p>
                        </div>
                        <span className="text-[10px] font-black text-[#014ba0] bg-[#014ba0]/10 px-2.5 py-1 rounded-lg shrink-0">
                          {r.stock_disponible} disp.
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Canasta de Artículos Seleccionados */}
              {lineas.length > 0 && (
                <div className="space-y-2.5 pt-2 animate-fadeIn">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Canasta de Salida</span>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {lineas.map(l => (
                      <div key={l.inventario_id} className="flex items-center justify-between gap-3 p-3 bg-slate-50/60 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500 border border-slate-200/40 rounded-lg shrink-0">
                            <Package size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{l.nombre}</p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Disponibilidad máxima: <span className="font-bold text-slate-600">{l.stock_disponible}</span></p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm p-0.5">
                            <button 
                              type="button" 
                              onClick={() => updateCantidad(l.inventario_id, l.cantidad - 1)}
                              className="w-6 h-6 text-xs text-slate-500 hover:bg-slate-100 rounded font-black transition-colors"
                            >
                              -
                            </button>
                            <span className="w-7 text-center text-xs font-black text-slate-900">{l.cantidad}</span>
                            <button 
                              type="button" 
                              onClick={() => updateCantidad(l.inventario_id, l.cantidad + 1)}
                              className="w-6 h-6 text-xs text-slate-500 hover:bg-slate-100 rounded font-black transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => quitarLinea(l.inventario_id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all active:scale-95"
                          >
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

        {/* Footer del Modal */}
        {!isView && (
          <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2.5 bg-slate-50/50">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#014ba0] hover:bg-[#004091] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-[#014ba0]/10 disabled:opacity-60 transition-all active:scale-[0.99] w-full sm:w-auto"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {loading ? "Registrando..." : "Emitir Préstamo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewPrestamo({ prestamo }: { prestamo: any }) {
  const ESTADO_CLS: Record<string, string> = {
    activo: "bg-blue-50 text-blue-700 border-blue-200/60",
    devuelto: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    atrasado: "bg-rose-50 text-rose-700 border-rose-200/60",
    cancelado: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoField label="Solicitante Autorizado" value={prestamo.usuarios?.nombre_completo ?? prestamo.solicitante_externo ?? "—"} />
        <InfoField label="Departamento" value={prestamo.departamentos?.nombre ?? "—"} />
        <InfoField label="Fecha de Salida" value={new Date(prestamo.fecha_salida).toLocaleDateString("es-MX", { dateStyle: "long" })} />
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Estado Operacional</p>
          <div>
            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border capitalize ${ESTADO_CLS[prestamo.estado]}`}>
              {prestamo.estado}
            </span>
          </div>
        </div>
      </div>
      
      {prestamo.observaciones && (
        <div className="animate-fadeIn">
          <InfoField label="Observaciones Adicionales" value={prestamo.observaciones} />
        </div>
      )}
      
      <div className="space-y-2.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desglose de Artículos</p>
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          {(prestamo.detalle_prestamo ?? []).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 text-xs">
              <div className="pr-4 min-w-0">
                <p className="font-bold text-slate-900 truncate">{d.inventario?.nombre ?? "—"}</p>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{d.inventario?.clave}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-base text-[#014ba0]">x{d.cantidad}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Retornados: {d.amount_returned ?? d.cantidad_devuelta ?? 0}</p>
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
    <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-slate-800 truncate leading-relaxed">{value}</p>
    </div>
  );
}