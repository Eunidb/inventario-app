"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/client';
import { X, Search, PackageSearch, Loader2, AlertCircle, ShieldCheck, UserPlus, ClipboardList } from "lucide-react";
import type { Usuario, Departamento, InventarioItem } from "@/lib/supabase";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalPrestamo({ isOpen, onClose, onSuccess }: ModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogos
  const [usuariosRegistrados, setUsuariosRegistrados] = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);

  // Formulario ajustado
  const [form, setForm] = useState({
    nombre_solicitante: "", // <-- Ahora es un String (Texto libre)
    usuario_autoriza_id: "", // <-- Este sigue siendo un ID de tu tabla usuarios
    departamento_id: "",
    fecha_devolucion: "",
    observaciones: ""
  });

  const [itemsSeleccionados, setItemsSeleccionados] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        supabase.from("usuarios").select("*").order("nombre_completo"),
        supabase.from("departamentos").select("*").order("nombre"),
        supabase.from("inventario").select("*").gt("stock_disponible", 0)
      ]).then(([{ data: u }, { data: d }, { data: inv }]) => {
        setUsuariosRegistrados(u ?? []);
        setDepartamentos(d ?? []);
        setInventario(inv ?? []);
      });
    }
  }, [isOpen, supabase]);

  const agregarItem = (item: InventarioItem) => {
    if (itemsSeleccionados.find(i => i.id === item.id)) return;
    setItemsSeleccionados([...itemsSeleccionados, { ...item, cantidad_pedida: 1 }]);
    setBusqueda("");
  };

  const handleGuardar = async () => {
    setError(null);
    // Validación: que el nombre no esté vacío y que haya un autorizador seleccionado
    if (!form.nombre_solicitante.trim() || !form.usuario_autoriza_id || itemsSeleccionados.length === 0) {
      setError("Faltan datos obligatorios: Nombre de quien solicita, quién autoriza y material.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa");

      // Insertar Cabecera
      const { data: prestamo, error: pErr } = await supabase
        .from("prestamos")
        .insert({
          solicitante_externo: form.nombre_solicitante, // Guardamos el NOMBRE escrito
          autorizado_por: form.usuario_autoriza_id,     // ID del jefe/técnico seleccionado
          created_by: user.id,                          // Tu ID (el que registra)
          departamento_id: form.departamento_id || null,
          fecha_devolucion: form.fecha_devolucion || null,
          observaciones: form.observaciones,
          estado: 'activo'
        }).select().single();

      if (pErr) throw pErr;

      // Insertar Detalles
      const detalles = itemsSeleccionados.map(i => ({
        prestamo_id: prestamo.id,
        inventario_id: i.id,
        cantidad: i.cantidad_pedida
      }));

      const { error: dErr } = await supabase.from("detalle_prestamo").insert(detalles);
      if (dErr) throw dErr;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Registro de Salida</h2>
            <p className="text-xs text-slate-400 font-bold tracking-wide">CONTROL DE MATERIAL E INVENTARIO</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* SECCIÓN PERSONAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* INPUT DE TEXTO PARA EL SOLICITANTE */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                <UserPlus size={10} /> Nombre de quien solicita
              </label>
              <input 
                type="text"
                placeholder="Escribe el nombre completo..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={form.nombre_solicitante}
                onChange={e => setForm({...form, nombre_solicitante: e.target.value})}
              />
            </div>

            {/* SELECT PARA EL AUTORIZADOR */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                <ShieldCheck size={10} /> Persona que autoriza
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={form.usuario_autoriza_id}
                onChange={e => setForm({...form, usuario_autoriza_id: e.target.value})}
              >
                <option value="">Selecciona quien autoriza...</option>
                {usuariosRegistrados.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre_completo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SECCIÓN FECHA Y DEPARTAMENTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Programada Devolución</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                value={form.fecha_devolucion}
                onChange={e => setForm({...form, fecha_devolucion: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <ClipboardList size={10} /> Observaciones / Estado inicial
              </label>
              <input 
                type="text"
                placeholder="Ej: Se entrega con estuche"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                value={form.observaciones}
                onChange={e => setForm({...form, observaciones: e.target.value})}
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* BUSCADOR DE ARTÍCULOS (IGUAL QUE ANTES) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hojas / Herramientas / Equipos</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar en inventario..."
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-blue-500 outline-none transition-all"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                  {inventario.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(i => (
                    <button 
                      key={i.id}
                      onClick={() => agregarItem(i)}
                      className="w-full p-3 text-left text-xs hover:bg-blue-50 flex justify-between border-b border-slate-50 last:border-none"
                    >
                      <span className="font-bold text-slate-700">{i.nombre}</span>
                      <span className="text-blue-600 font-mono">Stock: {i.stock_disponible}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {itemsSeleccionados.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <PackageSearch size={16} className="text-blue-500" />
                    <div>
                      <p className="text-xs font-black text-slate-700">{item.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{item.clave}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number"
                      min="1"
                      value={item.cantidad_pedida}
                      onChange={e => {
                        const val = Math.min(Number(e.target.value), item.stock_disponible);
                        setItemsSeleccionados(itemsSeleccionados.map(i => i.id === item.id ? {...i, cantidad_pedida: val} : i));
                      }}
                      className="w-12 p-1 text-center bg-white border border-blue-200 rounded-lg text-xs font-black"
                    />
                    <button onClick={() => setItemsSeleccionados(itemsSeleccionados.filter(i => i.id !== item.id))}>
                      <X size={16} className="text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
            Cancelar
          </button>
          <button 
            disabled={loading}
            onClick={handleGuardar}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {loading ? "Procesando..." : "Registrar Salida"}
          </button>
        </div>
      </div>
    </div>
  );
}