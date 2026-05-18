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
  traslado: { label: "Traslado",  color: "sky",     Icon: Truck,              desc: "Mueve el artículo entre departamentos" },
};

const COLOR_CLS: Record<string, { btn: string; bg: string; ring: string }> = {
  emerald: { btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200", bg: "bg-emerald-50 text-emerald-700 border-emerald-200",  ring: "focus:ring-emerald-100" },
  orange:  { btn: "bg-orange-500 hover:bg-orange-600 shadow-orange-200",   bg: "bg-orange-50 text-orange-700 border-orange-200",     ring: "focus:ring-orange-100"  },
  purple:  { btn: "bg-purple-600 hover:bg-purple-700 shadow-purple-200",   bg: "bg-purple-50 text-purple-700 border-purple-200",     ring: "focus:ring-purple-100"  },
  red:     { btn: "bg-red-600 hover:bg-red-700 shadow-red-200",            bg: "bg-red-50 text-red-700 border-red-200",              ring: "focus:ring-red-100"     },
  sky:     { btn: "bg-sky-600 hover:bg-sky-700 shadow-sky-200",            bg: "bg-sky-50 text-sky-700 border-sky-200",              ring: "focus:ring-sky-100"     },
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { onClose(); resetForm(); }} />

      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-all">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-800">Registrar Movimiento</h2>
            <p className="text-xs text-slate-400">Actualiza el estado o ubicación de un artículo</p>
          </div>
          <button onClick={() => { onClose(); resetForm(); }}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body content scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Selector de Tipo */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {(["entrada", "salida", "ajuste", "baja"] as TipoMovimiento[]).map(key => {
                const val    = TIPO_CONFIG[key];
                const Icon   = val.Icon;
                const active = tipo === key;
                const ccls   = COLOR_CLS[val.color];
                return (
                  <button key={key} type="button" onClick={() => setTipo(key)}
                    className={`flex flex-col items-center gap-1 py-3 px-1.5 rounded-2xl border text-[11px] font-bold transition-all
                      ${active ? `${ccls.bg} border-current` : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"}`}>
                    <Icon size={18} />
                    {val.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setTipo("traslado")}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-bold transition-all
                ${tipo === "traslado"
                  ? `${COLOR_CLS.sky.bg} border-current`
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-600"}`}
            >
              <Truck size={17} />
              Traslado entre departamentos
              <ArrowRightLeft size={14} className="opacity-60" />
            </button>
            <p className="text-[11px] text-slate-400 mt-2 italic">{cfg.desc}</p>
          </div>

          {/* Buscador Integrado con Botón de Limpieza */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Artículo</label>
            {itemSel ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{itemSel.nombre}</p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {itemSel.clave} · Stock: <span className="font-bold text-slate-600">{itemSel.stock_disponible}</span>
                    {itemSel.departamentos?.nombre && (
                      <span className="ml-2 text-sky-600 font-semibold">📍 {itemSel.departamentos.nombre}</span>
                    )}
                  </p>
                </div>
                <button type="button"
                  onClick={() => { setItemSel(null); setSearch(""); setDeptoOrigen(""); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-2 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar artículo por nombre o clave..."
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {search && !buscando && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
                {buscando && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
                {resultados.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {resultados.map(r => (
                      <button key={r.id} type="button"
                        onClick={() => { setItemSel(r); setSearch(""); setResultados([]); }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{r.nombre}</p>
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            {r.clave}
                            {r.departamentos?.nombre && (
                              <span className="ml-2 text-slate-500">· {r.departamentos.nombre}</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-500 flex-shrink-0 whitespace-nowrap">{r.stock_disponible} disp.</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campos Dinámicos */}
          {tipo === "traslado" && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRightLeft size={14} className="text-sky-600" />
                  <span className="text-xs font-black text-sky-700 uppercase tracking-wider">Ruta del traslado</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Origen</label>
                    <select
                      value={deptoOrigen}
                      onChange={e => setDeptoOrigen(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="">Sin origen / Externo</option>
                      {departamentos.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Destino *</label>
                    <select
                      value={deptoDestino}
                      onChange={e => setDeptoDestino(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-100"
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center select-none">-</button>
                  <input type="number" min={1} value={cantidad}
                    onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center text-xl font-black text-sky-700 bg-slate-50 border border-slate-200 rounded-xl py-2 outline-none focus:ring-2 focus:ring-sky-100" />
                  <button type="button" onClick={() => setCantidad(c => c + 1)}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center select-none">+</button>
                </div>
              </div>
            </div>
          )}

          {tipo === "ajuste" && (
            <div className="animate-fade-in">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Nuevo Stock Global</label>
              <input 
                type="number" 
                min={0} 
                value={stockNuevo} 
                onChange={e => setStockNuevo(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ej. 50"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 font-bold" 
              />
            </div>
          )}

          {["entrada", "salida", "baja"].includes(tipo) && (
            <div className="animate-fade-in">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Cantidad de unidades</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center select-none">-</button>
                <input type="number" min={1} value={cantidad}
                  onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`flex-1 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-xl py-2 outline-none focus:ring-2 ${colorCls.ring}`} />
                <button type="button" onClick={() => setCantidad(c => c + 1)}
                  className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center select-none">+</button>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Justificación u Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Escribe el motivo del movimiento..."
              rows={3}
              className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 resize-none transition-all ${colorCls.ring}`}
            />
          </div>
        </div>

        {/* Footer Acción */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => { onClose(); resetForm(); }}
            className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold bg-white text-sm hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !itemSel}
            className={`px-4 py-3 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${colorCls.btn}`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirmar"}
          </button>
        </div>

      </div>
    </div>
  );
}