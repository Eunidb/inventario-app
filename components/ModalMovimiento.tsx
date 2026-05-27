/**
 * @file components/ModalMovimiento.tsx
 * @description Modal interactivo responsivo para la inserción de movimientos operativos.
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import {
  X, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal,
  Loader2, Search, ArrowRightLeft, Truck,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type TipoMovimiento = "entrada" | "salida" | "ajuste" | "baja" | "traslado";

const TIPO_CONFIG: Record<TipoMovimiento, { label: string; color: string; Icon: any; desc: string }> = {
  entrada:  { label: "Entrada",   color: "emerald", Icon: ArrowDownCircle,    desc: "Aumenta el stock disponible" },
  salida:   { label: "Salida",    color: "orange",  Icon: ArrowUpCircle,      desc: "Reduce el stock disponible" },
  ajuste:   { label: "Ajuste",    color: "purple",  Icon: SlidersHorizontal,  desc: "Corrección manual del inventario" },
  baja:     { label: "Baja",      color: "red",     Icon: ArrowUpCircle,      desc: "Artículo dado de baja definitiva" },
  traslado: { label: "Traslado",  color: "corporativo", Icon: Truck,          desc: "Mueve el artículo entre departamentos" },
};

// Reemplazamos "sky" por "corporativo" usando tus colores hex
const COLOR_CLS: Record<string, { btn: string; bg: string; ring: string }> = {
  emerald: { btn: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_12px_-4px_rgba(5,150,105,0.4)]", bg: "bg-emerald-50 text-emerald-700 border-emerald-200",  ring: "focus:ring-emerald-100" },
  orange:  { btn: "bg-orange-500 hover:bg-orange-600 shadow-[0_4px_12px_-4px_rgba(249,115,22,0.4)]",   bg: "bg-orange-50 text-orange-700 border-orange-200",    ring: "focus:ring-orange-100"  },
  purple:  { btn: "bg-purple-600 hover:bg-purple-700 shadow-[0_4px_12px_-4px_rgba(147,51,234,0.4)]",   bg: "bg-purple-50 text-purple-700 border-purple-200",    ring: "focus:ring-purple-100"  },
  red:     { btn: "bg-red-600 hover:bg-red-700 shadow-[0_4px_12px_-4px_rgba(220,38,38,0.4)]",          bg: "bg-red-50 text-red-700 border-red-200",             ring: "focus:ring-red-100"     },
  corporativo: { 
    btn: "bg-[#014ba0] hover:bg-[#004091] shadow-[0_8px_16px_-6px_rgba(1,75,160,0.4)]", 
    bg: "bg-[#014ba0]/5 text-[#014ba0] border-[#014ba0]/20", 
    ring: "focus:ring-[#014ba0]/20 focus:border-[#014ba0]/40" 
  },
};

export default function ModalMovimiento({ isOpen, onClose, onSaved }: Props) {
  const supabase = createClient();

  const [loading, setLoading]           = useState(false);
  const [tipo, setTipo]                 = useState<TipoMovimiento>("entrada");

  const [search, setSearch]             = useState("");
  const [buscando, setBuscando]         = useState(false);
  const [resultados, setResultados]     = useState<any[]>([]);
  const [itemSel, setItemSel]           = useState<any | null>(null);

  const [cantidad, setCantidad]         = useState(1);
  const [stockNuevo, setStockNuevo]     = useState<number | "">("");
  const [observaciones, setObservaciones] = useState("");

  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [deptoOrigen, setDeptoOrigen]   = useState<string>("");
  const [deptoDestino, setDeptoDestino] = useState<string>("");

  useEffect(() => {
    if (tipo !== "traslado" || departamentos.length > 0) return;
    supabase.from("departamentos").select("id, nombre").order("nombre")
      .then(({ data }) => setDepartamentos(data ?? []));
  }, [tipo, departamentos.length, supabase]);

  useEffect(() => {
    if (tipo === "traslado" && itemSel?.departamento_id) {
      setDeptoOrigen(String(itemSel.departamento_id));
    }
  }, [itemSel, tipo]);

  useEffect(() => {
    if (!search.trim() || itemSel) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      const { data } = await supabase
        .from("inventario")
        .select("id, clave, nombre, stock_disponible, stock_total, estado, departamento_id, departamentos(nombre)")
        .or(`nombre.ilike.%${search}%,clave.ilike.%${search}%`)
        .limit(8);
      setResultados(data ?? []);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search, itemSel, supabase]);

  const resetForm = () => {
    setTipo("entrada");
    setSearch("");
    setItemSel(null);
    setCantidad(1);
    setStockNuevo("");
    setObservaciones("");
    setDeptoOrigen("");
    setDeptoDestino("");
    setResultados([]);
  };

  const handleSubmit = async () => {
    if (!itemSel) { alert("Selecciona un artículo."); return; }

    if (tipo === "traslado") {
      if (!deptoDestino) { alert("Selecciona el departamento destino."); return; }
      if (deptoOrigen && deptoOrigen === deptoDestino) {
        alert("El departamento origen y destino no pueden ser el mismo."); return;
      }
    } else if (tipo === "ajuste") {
      if (stockNuevo === "") { alert("Ingresa el nuevo stock."); return; }
    } else {
      if (cantidad <= 0) { alert("La cantidad debe ser mayor a 0."); return; }
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const stockAntes = itemSel.stock_disponible;

    if (tipo === "traslado") {
      const { error: errInv } = await supabase
        .from("inventario")
        .update({ departamento_id: parseInt(deptoDestino) })
        .eq("id", itemSel.id);

      if (errInv) { alert("Error: " + errInv.message); setLoading(false); return; }

      const { error: errHist } = await supabase.from("historial_inventario").insert({
        inventario_id:        itemSel.id,
        usuario_id:           user!.id,
        tipo_movimiento:      "traslado",
        cantidad:             cantidad,
        stock_antes:          stockAntes,
        stock_despues:        stockAntes, 
        departamento_origen:  deptoOrigen  ? parseInt(deptoOrigen)  : null,
        departamento_destino: parseInt(deptoDestino),
        observaciones:        observaciones || null,
      });

      if (errHist) { alert("Error al registrar historial: " + errHist.message); setLoading(false); return; }

      setLoading(false);
      resetForm();
      onSaved();
      onClose();
      return;
    }

    let nuevaCant    = stockAntes;
    let cantMovimiento = Number(cantidad);

    if (tipo === "entrada") {
      nuevaCant = stockAntes + cantidad;
    } else if (tipo === "salida") {
      if (cantidad > stockAntes) { alert("Stock insuficiente."); setLoading(false); return; }
      nuevaCant = stockAntes - cantidad;
    } else if (tipo === "baja") {
      if (cantidad > stockAntes) { alert("No puedes dar de baja más de lo disponible."); setLoading(false); return; }
      nuevaCant = stockAntes - cantidad;
    } else if (tipo === "ajuste") {
      nuevaCant      = Number(stockNuevo);
      cantMovimiento = Math.abs(nuevaCant - stockAntes);
    }

    const updatePayload: any = { stock_disponible: nuevaCant };
    if (tipo === "entrada") updatePayload.stock_total = itemSel.stock_total + cantidad;
    if (tipo === "baja")    updatePayload.stock_total = itemSel.stock_total - cantidad;
    if (tipo === "ajuste")  updatePayload.stock_total = Number(stockNuevo);

    const { error: errInv } = await supabase.from("inventario").update(updatePayload).eq("id", itemSel.id);
    if (errInv) { alert("Error: " + errInv.message); setLoading(false); return; }

    await supabase.from("historial_inventario").insert({
      inventario_id:   itemSel.id,
      usuario_id:      user!.id,
      tipo_movimiento: tipo,
      cantidad:        cantMovimiento,
      stock_antes:     stockAntes,
      stock_despues:   nuevaCant,
      observaciones:   observaciones || null,
    });

    setLoading(false);
    resetForm();
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  const cfg      = TIPO_CONFIG[tipo];
  const colorCls = COLOR_CLS[cfg.color];

  return (
    // CONTENEDOR SIEMPRE CENTRADO
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      {/* OVERLAY CON TONO AZULADO Y BLUR */}
      <div 
        className="absolute inset-0 bg-[#004091]/20 backdrop-blur-sm animate-in fade-in duration-300 ease-out" 
        onClick={() => { onClose(); resetForm(); }} 
      />

      {/* MODAL WINDOW */}
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(1,75,160,0.3)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-300 ease-out">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-white z-10 relative">
          <div>
            <h2 className="text-xl font-black text-[#004091] tracking-tight">Registrar Movimiento</h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Actualiza el estado o ubicación</p>
          </div>
          <button onClick={() => { onClose(); resetForm(); }}
            className="p-2 rounded-full hover:bg-[#014ba0]/10 text-slate-400 hover:text-[#014ba0] transition-all duration-200">
            <X size={20} />
          </button>
        </div>

        {/* Body content scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">

          {/* Selector de Tipo */}
          <div>
            <label className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest block mb-2.5">
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-4 gap-2.5 mb-2.5">
              {(["entrada", "salida", "ajuste", "baja"] as TipoMovimiento[]).map(key => {
                const val    = TIPO_CONFIG[key];
                const Icon   = val.Icon;
                const active = tipo === key;
                const ccls   = COLOR_CLS[val.color];
                return (
                  <button key={key} type="button" onClick={() => setTipo(key)}
                    className={`flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-2xl border text-[11px] font-extrabold transition-all duration-200
                      ${active ? `${ccls.bg} border-current shadow-sm scale-105` : "bg-white border-slate-200 text-slate-400 hover:border-[#014ba0]/30 hover:text-[#014ba0]/70 hover:bg-[#014ba0]/5"}`}>
                    <Icon size={20} />
                    {val.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setTipo("traslado")}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-extrabold transition-all duration-200
                ${tipo === "traslado"
                  ? `${COLOR_CLS.corporativo.bg} border-current shadow-sm scale-[1.02]`
                  : "bg-white border-slate-200 text-slate-400 hover:border-[#014ba0]/30 hover:text-[#014ba0] hover:bg-[#014ba0]/5"}`}
            >
              <Truck size={18} />
              Traslado entre departamentos
              <ArrowRightLeft size={14} className="opacity-60 ml-1" />
            </button>
            <p className="text-[11px] text-slate-400 mt-2.5 font-medium text-center bg-slate-50 py-1.5 rounded-lg">{cfg.desc}</p>
          </div>

          {/* Buscador Integrado */}
          <div>
            <label className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest block mb-2.5">Artículo a modificar</label>
            {itemSel ? (
              <div className="flex items-center justify-between p-4 bg-[#014ba0]/5 border border-[#014ba0]/20 rounded-2xl transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#004091] truncate">{itemSel.nombre}</p>
                  <p className="text-[11px] font-mono text-[#014ba0]/70 mt-0.5 truncate">
                    {itemSel.clave} <span className="mx-1 text-slate-300">•</span> Stock: <span className="font-black text-[#014ba0]">{itemSel.stock_disponible}</span>
                    {itemSel.departamentos?.nombre && (
                      <>
                        <span className="mx-1 text-slate-300">•</span>
                        <span className="text-[#014ba0] font-bold">📍 {itemSel.departamentos.nombre}</span>
                      </>
                    )}
                  </p>
                </div>
                <button type="button"
                  onClick={() => { setItemSel(null); setSearch(""); setDeptoOrigen(""); }}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ml-3 flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative group">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#014ba0] transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o clave..."
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0]/30 transition-all font-medium text-slate-700"
                />
                {search && !buscando && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
                {buscando && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#014ba0] animate-spin" />}
                
                {/* Menú desplegable de resultados */}
                {resultados.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(1,75,160,0.2)] z-20 overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {resultados.map(r => (
                      <button key={r.id} type="button"
                        onClick={() => { setItemSel(r); setSearch(""); setResultados([]); }}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#014ba0]/5 transition-colors text-left gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{r.nombre}</p>
                          <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                            {r.clave}
                            {r.departamentos?.nombre && (
                              <span className="ml-2 text-[#014ba0]/60">· {r.departamentos.nombre}</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#014ba0] bg-[#014ba0]/10 px-2 py-1 rounded-lg flex-shrink-0 whitespace-nowrap">{r.stock_disponible} disp.</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campos Dinámicos */}
          {tipo === "traslado" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-5 bg-[#014ba0]/5 rounded-2xl border border-[#014ba0]/10">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft size={16} className="text-[#014ba0]" />
                  <span className="text-[11px] font-black text-[#014ba0] uppercase tracking-widest">Ruta del traslado</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#014ba0]/60 uppercase tracking-widest block mb-1.5">Origen</label>
                    <select
                      value={deptoOrigen}
                      onChange={e => setDeptoOrigen(e.target.value)}
                      className="w-full bg-white border border-[#014ba0]/20 rounded-xl px-3 py-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0]/40 transition-all font-medium appearance-none"
                    >
                      <option value="">Sin origen / Externo</option>
                      {departamentos.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#014ba0]/60 uppercase tracking-widest block mb-1.5">Destino *</label>
                    <select
                      value={deptoDestino}
                      onChange={e => setDeptoDestino(e.target.value)}
                      className="w-full bg-white border border-[#014ba0]/20 rounded-xl px-3 py-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0]/40 transition-all font-medium appearance-none"
                    >
                      <option value="">Seleccionar...</option>
                      {departamentos
                        .filter(d => !deptoOrigen || String(d.id) !== deptoOrigen)
                        .map(d => (
                          <option key={d.id} value={d.id}>{d.nombre}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest block mb-2.5">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))}
                    className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#014ba0] font-black text-xl flex items-center justify-center select-none transition-colors">-</button>
                  <input type="number" min={1} value={cantidad}
                    onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center text-2xl font-black text-[#004091] bg-white border border-[#014ba0]/20 rounded-2xl py-2 outline-none focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0]/40 transition-all" />
                  <button type="button" onClick={() => setCantidad(c => c + 1)}
                    className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#014ba0] font-black text-xl flex items-center justify-center select-none transition-colors">+</button>
                </div>
              </div>
            </div>
          )}

          {tipo === "ajuste" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest block mb-2.5">Nuevo Stock Global</label>
              <input 
                type="number" 
                min={0} 
                value={stockNuevo} 
                onChange={e => setStockNuevo(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ej. 50"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-300 transition-all font-black text-purple-700 text-center" 
              />
            </div>
          )}

          {["entrada", "salida", "baja"].includes(tipo) && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest block mb-2.5">Cantidad de unidades</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-black text-xl flex items-center justify-center select-none transition-colors">-</button>
                <input type="number" min={1} value={cantidad}
                  onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`flex-1 text-center text-2xl font-black bg-white border border-slate-200 rounded-2xl py-2 outline-none focus:ring-4 transition-all ${colorCls.ring}`} />
                <button type="button" onClick={() => setCantidad(c => c + 1)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-black text-xl flex items-center justify-center select-none transition-colors">+</button>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest block mb-2.5">Justificación u Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Escribe el motivo del movimiento..."
              rows={3}
              className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 resize-none transition-all font-medium text-slate-600 ${colorCls.ring}`}
            />
          </div>
        </div>

        {/* Footer Acción */}
        <div className="p-5 bg-white border-t border-slate-100 grid grid-cols-2 gap-4 flex-shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => { onClose(); resetForm(); }}
            className="px-4 py-3.5 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold bg-white text-sm hover:bg-slate-50 hover:border-slate-200 hover:text-slate-700 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !itemSel}
            className={`px-4 py-3.5 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${colorCls.btn}`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Confirmar Movimiento"}
          </button>
        </div>

      </div>
    </div>
  );
}