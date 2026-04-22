/**
 * @file components/ModalMovimiento.tsx
 * @description Modal para registrar un movimiento manual: entrada, salida o ajuste de stock.
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { X, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, Loader2, Search } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type TipoMovimiento = "entrada" | "salida" | "ajuste" | "baja";

const TIPO_CONFIG: Record<TipoMovimiento, { label: string; color: string; Icon: any; desc: string }> = {
  entrada: { label: "Entrada",  color: "emerald", Icon: ArrowDownCircle, desc: "Aumenta el stock disponible" },
  salida:  { label: "Salida",   color: "orange",  Icon: ArrowUpCircle,   desc: "Reduce el stock disponible" },
  ajuste:  { label: "Ajuste",   color: "purple",  Icon: SlidersHorizontal, desc: "Corrección manual de inventario" },
  baja:    { label: "Baja",     color: "red",     Icon: ArrowUpCircle,   desc: "Artículo dado de baja definitiva" },
};

const COLOR_CLS: Record<string, { btn: string; bg: string }> = {
  emerald: { btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  orange:  { btn: "bg-orange-500 hover:bg-orange-600 shadow-orange-200",   bg: "bg-orange-50 text-orange-700 border-orange-200" },
  purple:  { btn: "bg-purple-600 hover:bg-purple-700 shadow-purple-200",   bg: "bg-purple-50 text-purple-700 border-purple-200" },
  red:     { btn: "bg-red-600 hover:bg-red-700 shadow-red-200",            bg: "bg-red-50 text-red-700 border-red-200" },
};

export default function ModalMovimiento({ isOpen, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [loading, setLoading]   = useState(false);
  const [tipo, setTipo]         = useState<TipoMovimiento>("entrada");
  const [search, setSearch]     = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [itemSel, setItemSel]   = useState<any | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [stockNuevo, setStockNuevo] = useState<number | "">("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (!search.trim() || itemSel) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      const { data } = await supabase.from("inventario")
        .select("id, clave, nombre, stock_disponible, stock_total, estado")
        .or(`nombre.ilike.%${search}%,clave.ilike.%${search}%`)
        .limit(8);
      setResultados(data ?? []);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search, itemSel]);

  const resetForm = () => {
    setTipo("entrada");
    setSearch("");
    setItemSel(null);
    setCantidad(1);
    setStockNuevo("");
    setObservaciones("");
    setResultados([]);
  };

  const handleSubmit = async () => {
    if (!itemSel) { alert("Selecciona un artículo."); return; }
    if (tipo !== "ajuste" && cantidad <= 0) { alert("La cantidad debe ser mayor a 0."); return; }
    if (tipo === "ajuste" && stockNuevo === "") { alert("Ingresa el nuevo stock."); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const stockAntes = itemSel.stock_disponible;
    let nuevaCant = stockAntes;
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
      nuevaCant = Number(stockNuevo);
      cantMovimiento = Math.abs(nuevaCant - stockAntes);
    }

    // Actualizar inventario
    const updatePayload: any = { stock_disponible: nuevaCant };
    if (tipo === "entrada") updatePayload.stock_total = itemSel.stock_total + cantidad;
    if (tipo === "baja")    updatePayload.stock_total = itemSel.stock_total - cantidad;
    if (tipo === "ajuste")  { updatePayload.stock_total = Number(stockNuevo); }

    const { error: errInv } = await supabase.from("inventario").update(updatePayload).eq("id", itemSel.id);
    if (errInv) { alert("Error: " + errInv.message); setLoading(false); return; }

    // Registrar en historial
    await supabase.from("historial_inventario").insert({
      inventario_id: itemSel.id,
      usuario_id: user!.id,
      tipo_movimiento: tipo,
      cantidad: cantMovimiento,
      stock_antes: stockAntes,
      stock_despues: nuevaCant,
      observaciones: observaciones || null,
    });

    setLoading(false);
    resetForm();
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  const cfg = TIPO_CONFIG[tipo];
  const colorCls = COLOR_CLS[cfg.color];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { onClose(); resetForm(); }} />
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800">Registrar Movimiento</h2>
            <p className="text-xs text-slate-400">Actualiza el stock de un artículo</p>
          </div>
          <button onClick={() => { onClose(); resetForm(); }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Selector de tipo */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tipo de movimiento</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(TIPO_CONFIG) as [TipoMovimiento, any][]).map(([key, val]) => {
                const Icon = val.Icon;
                const active = tipo === key;
                const ccls = COLOR_CLS[val.color];
                return (
                  <button key={key} type="button" onClick={() => setTipo(key)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${active ? `${ccls.bg} border-current` : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"}`}>
                    <Icon size={18} />
                    {val.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 italic">{cfg.desc}</p>
          </div>

          {/* Buscador artículo */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Artículo</label>
            {itemSel ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-800">{itemSel.nombre}</p>
                  <p className="text-[11px] font-mono text-slate-400">{itemSel.clave} · Stock actual: <span className="font-bold text-slate-600">{itemSel.stock_disponible}</span></p>
                </div>
                <button type="button" onClick={() => { setItemSel(null); setSearch(""); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar artículo por nombre o clave..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                {buscando && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
                {resultados.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 overflow-hidden max-h-52 overflow-y-auto">
                    {resultados.map(r => (
                      <button key={r.id} type="button" onClick={() => { setItemSel(r); setSearch(""); setResultados([]); }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{r.nombre}</p>
                          <p className="text-[11px] font-mono text-slate-400">{r.clave}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{r.stock_disponible} disp.</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cantidad o nuevo stock */}
          {tipo === "ajuste" ? (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Nuevo stock</label>
              <input type="number" min={0} value={stockNuevo}
                onChange={e => setStockNuevo(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-purple-600 outline-none focus:ring-2 focus:ring-purple-100" />
              {itemSel && stockNuevo !== "" && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Diferencia: <span className={`font-bold ${Number(stockNuevo) >= itemSel.stock_disponible ? "text-emerald-600" : "text-red-600"}`}>
                    {Number(stockNuevo) >= itemSel.stock_disponible ? "+" : ""}{Number(stockNuevo) - itemSel.stock_disponible}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Cantidad</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg transition-colors flex items-center justify-center">−</button>
                <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={() => setCantidad(c => c + 1)}
                  className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg transition-colors flex items-center justify-center">+</button>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Observaciones (opcional)</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
              rows={2} placeholder="Motivo, referencia, proveedor..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={() => { onClose(); resetForm(); }} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg disabled:opacity-60 transition-all ${colorCls.btn}`}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <cfg.Icon size={15} />}
            {loading ? "Guardando..." : `Registrar ${cfg.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}