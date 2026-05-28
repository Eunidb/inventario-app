"use client";

/**
 * @file app/configuracion/page.tsx
 * @description Configuración del sistema: categorías, departamentos y gestión de usuarios.
 *
 * CORRECCIONES:
 * 1. ModalUsuario antes mostraba `null` cuando `item` era null (al crear),
 *    porque verificaba `!item` al inicio. Se separó en:
 *    - `ModalNuevoUsuario`: crea usuarios vía `supabase.auth.signUp()` (obligatorio
 *      para que Supabase Auth genere la sesión y dispare el trigger de la tabla usuarios).
 *    - `ModalUsuario`: solo edita rol y departamento de un usuario existente.
 * 2. El botón "Nuevo" en la pestaña usuarios ahora abre `ModalNuevoUsuario`.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import {
  Settings, Tag, Building2, Users, Plus, Pencil, Trash2,
  X, Loader2, Save, UserCheck, Mail, Lock, User, Briefcase, Shield,
  AlertCircle, CheckCircle,
} from "lucide-react";

type Tab = "categorias" | "departamentos" | "usuarios";

/** Estilos de badge por rol */
const ROL_CLS: Record<string, string> = {
  admin:   "bg-purple-50 text-purple-700 border-purple-100",
  usuario: "bg-[#014ba0]/5 text-[#014ba0]/90 border-[#014ba0]/10",
  tecnico: "bg-teal-50 text-teal-700 border-teal-100",
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const [tab, setTab]                   = useState<Tab>("categorias");
  const [categorias, setCategorias]     = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [usuarios, setUsuarios]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);

  // Estado de modales: open + item (null = crear, objeto = editar)
  const [modalCat, setModalCat]       = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [modalDept, setModalDept]     = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [modalUser, setModalUser]     = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  // Modal exclusivo para CREAR un nuevo usuario (requiere Auth)
  const [modalNuevoUser, setModalNuevoUser] = useState(false);

  const supabase = createClient();

  /** Carga todos los datos en paralelo */
  const loadData = async () => {
    setLoading(true);
    const [{ data: cats }, { data: deptos }, { data: users }] = await Promise.all([
      supabase.from("categorias").select("*").order("nombre"),
      supabase.from("departamentos").select("*").order("nombre"),
      supabase.from("usuarios").select("*, departamentos(nombre)").order("nombre_completo"),
    ]);
    setCategorias(cats ?? []);
    setDepartamentos(deptos ?? []);
    setUsuarios(users ?? []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const TABS = [
    { id: "categorias" as Tab,    label: "Categorías",    Icon: Tag,       count: categorias.length },
    { id: "departamentos" as Tab, label: "Departamentos", Icon: Building2, count: departamentos.length },
    { id: "usuarios" as Tab,      label: "Usuarios",      Icon: Users,     count: usuarios.length },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 lg:ml-64 w-full min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 pt-24 lg:pt-10 max-w-5xl mx-auto w-full box-border">

          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 sm:gap-3">
              <Settings size={26} className="text-[#004091] shrink-0" />
              Configuración
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Administra categorías, departamentos y usuarios del sistema
            </p>
          </div>

          {/* Tabs — scroll horizontal en pantallas pequeñas */}
          <div className="w-full overflow-x-auto no-scrollbar mb-6 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex gap-1.5 min-w-max sm:min-w-0">
              {TABS.map(({ id, label, Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    tab === id
                      ? "bg-[#014ba0] text-white shadow-md hover:bg-[#004091]"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <span>{label}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                    tab === id ? "bg-[#004091] text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Panel de contenido */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden w-full">

            {/* Barra de acciones */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center gap-4">
              <p className="text-xs sm:text-sm font-bold text-slate-600 truncate">
                {tab === "categorias"    ? "Categorías de inventario"      :
                 tab === "departamentos" ? "Departamentos de la empresa"   : "Usuarios del sistema"}
              </p>
              <button
                onClick={() => {
                  if (tab === "categorias")     setModalCat({ open: true, item: null });
                  if (tab === "departamentos")  setModalDept({ open: true, item: null });
                  // CORRECCIÓN: usuarios usa modal de creación dedicado
                  if (tab === "usuarios")       setModalNuevoUser(true);
                }}
                className="flex items-center gap-1.5 bg-[#014ba0] hover:bg-[#004091] text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all shrink-0"
              >
                <Plus size={14} /> Nuevo
              </button>
            </div>

            {loading ? (
              <div className="p-6 sm:p-8 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {/* ── Categorías ── */}
                {tab === "categorias" && categorias.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors group gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#014ba0]/5 border border-[#014ba0]/10 flex items-center justify-center shrink-0">
                        <Tag size={16} className="text-[#014ba0]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{cat.nombre}</p>
                        {cat.descripcion && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-none">{cat.descripcion}</p>
                        )}
                      </div>
                    </div>
                    {/* Botones: siempre visibles en móvil, con hover en escritorio */}
                    <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalCat({ open: true, item: cat })}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#014ba0] hover:bg-[#014ba0]/5 transition-all">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDeleteCat(cat.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {tab === "categorias" && categorias.length === 0 && <EmptyState label="categorías" />}

                {/* ── Departamentos ── */}
                {tab === "departamentos" && departamentos.map(dept => (
                  <div key={dept.id} className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors group gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{dept.nombre}</p>
                        {dept.responsable && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-none">
                            Responsable: {dept.responsable}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalDept({ open: true, item: dept })}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#014ba0] hover:bg-[#014ba0]/5 transition-all">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDeleteDept(dept.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {tab === "departamentos" && departamentos.length === 0 && <EmptyState label="departamentos" />}

                {/* ── Usuarios ── */}
                {tab === "usuarios" && usuarios.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors group gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#014ba0] to-[#004091] flex items-center justify-center text-white font-black text-xs sm:text-sm shrink-0">
                        {u.nombre_completo?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{u.nombre_completo}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-none">
                          {u.username} · {u.departamentos?.nombre ?? "Sin depto."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl text-[9px] sm:text-[10px] font-bold border shrink-0 ${ROL_CLS[u.rol] ?? ROL_CLS.usuario}`}>
                        {u.rol}
                      </span>
                      <div className="flex shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModalUser({ open: true, item: u })}
                          className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-[#014ba0] hover:bg-[#014ba0]/5 transition-all">
                          <Pencil size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {tab === "usuarios" && usuarios.length === 0 && <EmptyState label="usuarios" />}

              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Modales ── */}
      <ModalCategoria
        isOpen={modalCat.open}
        item={modalCat.item}
        onClose={() => setModalCat({ open: false, item: null })}
        onSaved={loadData}
      />
      <ModalDepartamento
        isOpen={modalDept.open}
        item={modalDept.item}
        onClose={() => setModalDept({ open: false, item: null })}
        onSaved={loadData}
      />
      {/* Editar usuario existente */}
      <ModalUsuario
        isOpen={modalUser.open}
        item={modalUser.item}
        deptos={departamentos}
        onClose={() => setModalUser({ open: false, item: null })}
        onSaved={loadData}
      />
      {/* Crear nuevo usuario vía Auth */}
      <ModalNuevoUsuario
        isOpen={modalNuevoUser}
        deptos={departamentos}
        onClose={() => setModalNuevoUser(false)}
        onSaved={() => { setModalNuevoUser(false); loadData(); }}
      />
    </div>
  );

  async function handleDeleteCat(id: number) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await supabase.from("categorias").delete().eq("id", id);
    loadData();
  }
  async function handleDeleteDept(id: number) {
    if (!confirm("¿Eliminar este departamento?")) return;
    await supabase.from("departamentos").delete().eq("id", id);
    loadData();
  }
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-14 text-center text-slate-400 text-sm font-medium">
      No hay {label} registradas
    </div>
  );
}

// ─── Modal: Crear nuevo usuario ───────────────────────────────────────────────
/**
 * Usa `supabase.auth.signUp()` porque Supabase requiere crear el registro
 * de autenticación primero; el trigger de la DB crea la fila en `usuarios`.
 */
function ModalNuevoUsuario({
  isOpen,
  deptos,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  deptos: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();

  const [nombre,   setNombre]   = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [rol,      setRol]      = useState("usuario");
  const [deptId,   setDeptId]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  // Limpia el formulario al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setNombre(""); setEmail(""); setPassword("");
      setRol("usuario"); setDeptId("");
      setError(null); setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError("Nombre, correo y contraseña son obligatorios.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    // signUp registra al usuario en Auth y dispara el trigger que
    // inserta la fila en la tabla `usuarios` con los metadatos.
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nombre_completo: nombre.trim(),
          rol,
          departamento_id: deptId || null,
        },
      },
    });

    if (authError) {
      const msg = authError.message.toLowerCase().includes("already registered")
        ? "Este correo ya está registrado."
        : authError.message;
      setError(msg);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(onSaved, 1500);
  };

  return (
    <ModalShell title="Nuevo Usuario" Icon={Users} onClose={onClose}>
      <div className="space-y-4">

        {/* Alerta de error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-xs text-red-700 font-medium">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Confirmación de éxito */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-xs text-emerald-700 font-medium">
            <CheckCircle size={15} className="shrink-0" /> Usuario creado correctamente.
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Nombre completo *
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
            />
          </div>
        </div>

        {/* Correo */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Correo electrónico *
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
            />
          </div>
        </div>

        {/* Contraseña */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Contraseña * (mín. 6 caracteres)
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
            />
          </div>
        </div>

        {/* Rol */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Rol</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { val: "usuario", label: "Usuario", icon: "👤" },
              { val: "tecnico", label: "Técnico", icon: "🔧" },
              { val: "admin",   label: "Admin",   icon: "⚡" },
            ].map(r => (
              <button key={r.val} type="button" onClick={() => setRol(r.val)}
                className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all text-center ${
                  rol === r.val
                    ? "bg-[#014ba0] text-white border-[#014ba0] shadow-md"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-[#014ba0]/40"
                }`}>
                <span className="block text-base mb-0.5">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Departamento */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Departamento</label>
          <div className="relative">
            <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={deptId}
              onChange={e => setDeptId(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0] appearance-none cursor-pointer"
            >
              <option value="">Sin departamento</option>
              {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      <ModalFooter loading={loading} onClose={onClose} onSave={save} label="Crear Usuario" />
    </ModalShell>
  );
}

// ─── Modal: Editar usuario existente ─────────────────────────────────────────
/**
 * Solo permite cambiar rol y departamento.
 * No se expone el cambio de contraseña ni correo desde aquí
 * para mantener la integridad del sistema de autenticación.
 */
function ModalUsuario({
  isOpen,
  item,
  deptos,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  item: any;
  deptos: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [rol,    setRol]    = useState("usuario");
  const [deptId, setDeptId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRol(item?.rol ?? "usuario");
    setDeptId(item?.departamento_id ? String(item.departamento_id) : "");
  }, [item, isOpen]);

  // CORRECCIÓN: `!item` ya no bloquea la apertura del modal de edición;
  // pero si no hay item, simplemente no renderizamos (solo aplica a edición).
  if (!isOpen || !item) return null;

  const save = async () => {
    setLoading(true);
    await supabase.from("usuarios").update({
      rol,
      departamento_id: deptId ? parseInt(deptId) : null,
    }).eq("id", item.id);
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <ModalShell title="Editar Usuario" Icon={UserCheck} onClose={onClose}>
      <div className="space-y-4">

        {/* Tarjeta de identidad del usuario */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#014ba0] to-[#004091] flex items-center justify-center text-white font-black text-sm shrink-0">
              {item.nombre_completo?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800 text-sm truncate">{item.nombre_completo}</p>
              <p className="text-xs text-slate-400 truncate">{item.username}</p>
            </div>
          </div>
        </div>

        {/* Selector de rol */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Rol</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { val: "usuario", label: "Usuario", icon: "👤" },
              { val: "tecnico", label: "Técnico", icon: "🔧" },
              { val: "admin",   label: "Admin",   icon: "⚡" },
            ].map(r => (
              <button key={r.val} type="button" onClick={() => setRol(r.val)}
                className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all text-center ${
                  rol === r.val
                    ? "bg-[#014ba0] text-white border-[#014ba0] shadow-md"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-[#014ba0]/40"
                }`}>
                <span className="block text-base mb-0.5">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de departamento */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Departamento</label>
          <select
            value={deptId}
            onChange={e => setDeptId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
          >
            <option value="">Sin departamento</option>
            {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
      </div>

      <ModalFooter loading={loading} onClose={onClose} onSave={save} label="Guardar" />
    </ModalShell>
  );
}

// ─── Modal: Categoría ─────────────────────────────────────────────────────────

function ModalCategoria({
  isOpen, item, onClose, onSaved,
}: { isOpen: boolean; item: any; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [nombre,      setNombre] = useState("");
  const [descripcion, setDesc]   = useState("");
  const [loading,     setLoading] = useState(false);

  useEffect(() => {
    setNombre(item?.nombre ?? "");
    setDesc(item?.descripcion ?? "");
  }, [item, isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    if (!nombre.trim()) { alert("El nombre es requerido."); return; }
    setLoading(true);
    const payload = { nombre: nombre.trim(), descripcion: descripcion.trim() || null };
    item
      ? await supabase.from("categorias").update(payload).eq("id", item.id)
      : await supabase.from("categorias").insert([payload]);
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <ModalShell title={item ? "Editar Categoría" : "Nueva Categoría"} Icon={Tag} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nombre"      value={nombre}      onChange={setNombre} placeholder="Ej. Herramientas" />
        <Field label="Descripción" value={descripcion} onChange={setDesc}   placeholder="Opcional..." />
      </div>
      <ModalFooter loading={loading} onClose={onClose} onSave={save} label={item ? "Guardar" : "Crear"} />
    </ModalShell>
  );
}

// ─── Modal: Departamento ──────────────────────────────────────────────────────

function ModalDepartamento({
  isOpen, item, onClose, onSaved,
}: { isOpen: boolean; item: any; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [nombre,      setNombre]       = useState("");
  const [descripcion, setDesc]         = useState("");
  const [responsable, setResponsable]  = useState("");
  const [loading,     setLoading]      = useState(false);

  useEffect(() => {
    setNombre(item?.nombre ?? "");
    setDesc(item?.descripcion ?? "");
    setResponsable(item?.responsable ?? "");
  }, [item, isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    if (!nombre.trim()) { alert("El nombre es requerido."); return; }
    setLoading(true);
    const payload = {
      nombre:      nombre.trim(),
      descripcion: descripcion.trim() || null,
      responsable: responsable.trim() || null,
    };
    item
      ? await supabase.from("departamentos").update(payload).eq("id", item.id)
      : await supabase.from("departamentos").insert([payload]);
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <ModalShell title={item ? "Editar Departamento" : "Nuevo Departamento"} Icon={Building2} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nombre"       value={nombre}      onChange={setNombre}      placeholder="Ej. Mantenimiento" />
        <Field label="Responsable"  value={responsable} onChange={setResponsable} placeholder="Nombre del jefe de área" />
        <Field label="Descripción"  value={descripcion} onChange={setDesc}        placeholder="Opcional..." />
      </div>
      <ModalFooter loading={loading} onClose={onClose} onSave={save} label={item ? "Guardar" : "Crear"} />
    </ModalShell>
  );
}

// ─── Componentes auxiliares compartidos ──────────────────────────────────────

/** Contenedor genérico de modal con overlay y botón X */
function ModalShell({
  title, Icon, onClose, children,
}: { title: string; Icon: any; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#004091] rounded-xl text-white shrink-0">
              <Icon size={16} />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-800 truncate">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/** Campo de texto genérico */
function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
      />
    </div>
  );
}

/** Footer con botones Cancelar / Guardar */
function ModalFooter({
  loading, onClose, onSave, label,
}: { loading: boolean; onClose: () => void; onSave: () => void; label: string }) {
  return (
    <div className="flex justify-end gap-2 mt-5 shrink-0">
      <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors">
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={loading}
        className="flex items-center gap-1.5 bg-[#014ba0] hover:bg-[#004091] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-[#014ba0]/20 disabled:opacity-60 transition-all"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        <span>{loading ? "Guardando..." : label}</span>
      </button>
    </div>
  );
}