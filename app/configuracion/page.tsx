"use client";

/**
 * @file app/configuracion/page.tsx
 * @description Configuración del sistema optimizada: Grid de categorías/deptos y Tabla responsiva de usuarios.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import {
  Settings,
  Tag,
  Building2,
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Save,
  UserCheck,
  Mail,
  Lock,
  User,
  Briefcase,
  Shield,
  AlertCircle,
  CheckCircle,
  Hash,
  Search,
} from "lucide-react";

type Tab = "categorias" | "departamentos" | "usuarios";

/** Estilos de badge por rol */
const ROL_CLS: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  usuario: "bg-[#014ba0]/5 text-[#014ba0]/90 border-[#014ba0]/10",
  tecnico: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>("categorias");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modales
  const [modalCat, setModalCat] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [modalDept, setModalDept] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [modalUser, setModalUser] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [modalNuevoUser, setModalNuevoUser] = useState(false);

  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: deptos }, { data: users }] = await Promise.all([
        supabase.from("categorias").select("*").order("nombre"),
        supabase.from("departamentos").select("*").order("nombre"),
        supabase.from("usuarios").select("*, departamentos(nombre)").order("nombre_completo"),
      ]);
      setCategorias(cats ?? []);
      setDepartamentos(deptos ?? []);
      setUsuarios(users ?? []);
    } catch (error) {
      console.error("Error cargando configuraciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const TABS = [
    { id: "categorias" as Tab, label: "Categorías", Icon: Tag, count: categorias.length },
    { id: "departamentos" as Tab, label: "Departamentos", Icon: Building2, count: departamentos.length },
    { id: "usuarios" as Tab, label: "Usuarios", Icon: Users, count: usuarios.length },
  ];

  // Filtrado en tiempo real para un plus de UX
  const filteredCategorias = categorias.filter(c => c.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDeptos = departamentos.filter(d => d.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers = usuarios.filter(u => u.nombre_completo?.toLowerCase().includes(searchQuery.toLowerCase()) || u.username?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 w-full min-w-0 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full pt-20 lg:pt-8 space-y-6">
          
          {/* Header de la sección */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-[#014ba0]/10 rounded-xl">
                  <Settings size={22} className="text-[#014ba0]" />
                </div>
                Panel de Configuración
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                Gestiona estructuras globales de inventario, áreas de la empresa y credenciales de acceso.
              </p>
            </div>
            
            <button
              onClick={() => {
                if (tab === "categorias") setModalCat({ open: true, item: null });
                if (tab === "departamentos") setModalDept({ open: true, item: null });
                if (tab === "usuarios") setModalNuevoUser(true);
              }}
              className="flex items-center justify-center gap-2 bg-[#014ba0] hover:bg-[#004091] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-900/10 hover:shadow-lg transition-all duration-200 group shrink-0"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span>Añadir {tab === "categorias" ? "Categoría" : tab === "departamentos" ? "Departamento" : "Usuario"}</span>
            </button>
          </div>

          {/* Navegación por Tabs Estilizada */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {TABS.map(({ id, label, Icon, count }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setSearchQuery(""); }}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap flex-1 sm:flex-initial ${
                    tab === id
                      ? "bg-white text-[#014ba0] shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${tab === id ? 'bg-[#014ba0]/10 text-[#014ba0]' : 'bg-slate-300/50 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Buscador Integrado */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar en ${tab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0] shadow-sm"
              />
            </div>
          </div>

          {/* Renderizado de Paneles Dinámicos */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm animate-pulse">
                  <div className="flex gap-3"><div className="w-8 h-8 bg-slate-200 rounded-lg"></div><div className="h-4 bg-slate-200 rounded w-1/2 mt-2"></div></div>
                  <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full">
              {/* ── SECCIÓN CATEGORÍAS (Grid Layout) ── */}
              {tab === "categorias" && (
                filteredCategorias.length === 0 ? <EmptyState label="categorías" /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategorias.map((cat) => (
                      <div key={cat.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#014ba0]/20 transition-all duration-200 flex flex-col justify-between group relative">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-9 h-9 rounded-xl bg-[#014ba0]/5 border border-[#014ba0]/10 flex items-center justify-center shrink-0">
                              <Tag size={16} className="text-[#014ba0]" />
                            </div>
                            <div className="flex gap-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <button onClick={() => setModalCat({ open: true, item: cat })} className="p-1.5 text-slate-400 hover:text-[#014ba0] hover:bg-slate-50 rounded-lg transition-colors">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDeleteCat(cat.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm mt-3">{cat.nombre}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                            {cat.descripcion || "Sin descripción asignada."}
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-[11px] text-slate-400">
                          <Hash size={12} className="mr-1" /> ID Interno: {cat.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── SECCIÓN DEPARTAMENTOS (Grid Layout) ── */}
              {tab === "departamentos" && (
                filteredDeptos.length === 0 ? <EmptyState label="departamentos" /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDeptos.map((dept) => (
                      <div key={dept.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-200 flex flex-col justify-between group">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                              <Building2 size={16} className="text-emerald-600" />
                            </div>
                            <div className="flex gap-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <button onClick={() => setModalDept({ open: true, item: dept })} className="p-1.5 text-slate-400 hover:text-[#014ba0] hover:bg-slate-50 rounded-lg transition-colors">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDeleteDept(dept.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm mt-3">{dept.nombre}</h3>
                          {dept.descripcion && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{dept.descripcion}</p>}
                        </div>
                        <div className="mt-4 bg-slate-50 rounded-xl p-2.5 flex items-center gap-2 border border-slate-100">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                            {dept.responsable?.charAt(0) || "S"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Responsable</p>
                            <p className="text-xs font-semibold text-slate-700 truncate">{dept.responsable || "No asignado"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── SECCIÓN USUARIOS (Tabla Líquida / Tarjetas Móviles) ── */}
              {tab === "usuarios" && (
                filteredUsers.length === 0 ? <EmptyState label="usuarios" /> : (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    
                    {/* Vista Desktop (Tabla real) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            <th className="px-6 py-4">Usuario / Colaborador</th>
                            <th className="px-6 py-4">Nombre de usuario</th>
                            <th className="px-6 py-4">Departamento</th>
                            <th className="px-6 py-4">Rol del Sistema</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                          {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#014ba0] to-[#004091] flex items-center justify-center text-white font-black text-xs">
                                    {u.nombre_completo?.charAt(0).toUpperCase() ?? "?"}
                                  </div>
                                  <span className="font-bold text-slate-800">{u.nombre_completo}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-medium">{u.username || "—"}</td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                                  {u.departamentos?.nombre ?? "Sin depto."}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase ${ROL_CLS[u.rol] ?? ROL_CLS.usuario}`}>
                                  {u.rol}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => setModalUser({ open: true, item: u })}
                                  className="p-2 text-slate-500 hover:text-[#014ba0] hover:bg-[#014ba0]/5 rounded-xl transition-all"
                                  title="Gestionar Perfil"
                                >
                                  <Pencil size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Vista Móvil (Tarjetas de Perfil Líquidas) */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#014ba0] to-[#004091] flex items-center justify-center text-white font-black text-xs">
                                {u.nombre_completo?.charAt(0).toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{u.nombre_completo}</h4>
                                <p className="text-xs text-slate-400">@{u.username || "sin-user"}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase ${ROL_CLS[u.rol] ?? ROL_CLS.usuario}`}>
                              {u.rol}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-1">
                            <div className="text-xs text-slate-500">
                              Depto: <span className="font-semibold text-slate-700">{u.departamentos?.nombre ?? "Ninguno"}</span>
                            </div>
                            <button
                              onClick={() => setModalUser({ open: true, item: u })}
                              className="flex items-center gap-1 text-xs font-bold text-[#014ba0] bg-[#014ba0]/5 px-3 py-1.5 rounded-lg"
                            >
                              <Pencil size={12} /> Gestionar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── MODALES RECONSTRUIDOS ── */}
      <ModalCategoria isOpen={modalCat.open} item={modalCat.item} onClose={() => setModalCat({ open: false, item: null })} onSaved={loadData} />
      <ModalDepartamento isOpen={modalDept.open} item={modalDept.item} onClose={() => setModalDept({ open: false, item: null })} onSaved={loadData} />
      
      {/* Modal Usuario con Plus de Cambio de Nombre */}
      <ModalUsuario isOpen={modalUser.open} item={modalUser.item} deptos={departamentos} onClose={() => setModalUser({ open: false, item: null })} onSaved={loadData} />
      <ModalNuevoUsuario isOpen={modalNuevoUser} deptos={departamentos} onClose={() => setModalNuevoUser(false)} onSaved={() => { setModalNuevoUser(false); loadData(); }} />
    </div>
  );

  async function handleDeleteCat(id: number) {
    if (!confirm("¿Eliminar esta categoría de forma permanente?")) return;
    await supabase.from("categorias").delete().eq("id", id);
    loadData();
  }
  async function handleDeleteDept(id: number) {
    if (!confirm("¿Eliminar este departamento de forma permanente?")) return;
    await supabase.from("departamentos").delete().eq("id", id);
    loadData();
  }
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white border border-dashed border-slate-300 py-12 rounded-2xl text-center text-slate-400 text-sm font-medium">
      No se encontraron {label} registradas o que coincidan con la búsqueda.
    </div>
  );
}

// ─── MODAL PLUS: EDITAR USUARIO (ADMIN POWER) ─────────────────────────────────────────
function ModalUsuario({ isOpen, item, deptos, onClose, onSaved }: { isOpen: boolean; item: any; deptos: any[]; onClose: () => void; onSaved: () => void; }) {
  const supabase = createClient();
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [username, setUsername] = useState("");
  const [rol, setRol] = useState("usuario");
  const [deptId, setDeptId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setNombreCompleto(item.nombre_completo ?? "");
      setUsername(item.username ?? "");
      setRol(item.rol ?? "usuario");
      setDeptId(item.departamento_id ? String(item.departamento_id) : "");
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const save = async () => {
    if (!nombreCompleto.trim()) {
      alert("El nombre completo no puede quedar vacío.");
      return;
    }
    setLoading(true);
    await supabase
      .from("usuarios")
      .update({
        nombre_completo: nombreCompleto.trim(),
        username: username.trim() || null,
        rol,
        departamento_id: deptId ? parseInt(deptId) : null,
      })
      .eq("id", item.id);
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <ModalShell title="Gestionar Perfil de Usuario" Icon={UserCheck} onClose={onClose}>
      <div className="space-y-4">
        {/* Plus UX: Inputs Editables de nombre y Username para el admin */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nombre Completo</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#014ba0]"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Username (Identificador)</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#014ba0]"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Rol de Cuenta</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { val: "usuario", label: "Usuario", Icon: User },
              { val: "tecnico", label: "Técnico", Icon: Briefcase },
              { val: "admin", label: "Admin", Icon: Shield },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => setRol(r.val)}
                className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all text-center ${
                  rol === r.val
                    ? "bg-[#014ba0] text-white border-[#014ba0] shadow-sm"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-[#014ba0]/30"
                }`}
              >
                <r.Icon size={14} className="mx-auto mb-1" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Área / Departamento</label>
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#014ba0] cursor-pointer"
          >
            <option value="">Sin departamento asignado</option>
            {deptos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <ModalFooter loading={loading} onClose={onClose} onSave={save} label="Actualizar Usuario" />
    </ModalShell>
  );
}

// ─── MODAL: NUEVO USUARIO ───────────────────────────────────────────────────
function ModalNuevoUsuario({ isOpen, deptos, onClose, onSaved }: { isOpen: boolean; deptos: any[]; onClose: () => void; onSaved: () => void; }) {
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("usuario");
  const [deptId, setDeptId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNombre(""); setEmail(""); setPassword(""); setRol("usuario"); setDeptId(""); setError(null); setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError("Todos los campos marcados con asterisco son mandatorios.");
      return;
    }
    setLoading(true); setError(null);

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
      setError(authError.message.toLowerCase().includes("already registered") ? "Este email corporativo ya está registrado." : authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(onSaved, 1200);
  };

  return (
    <ModalShell title="Registrar Colaborador" Icon={Users} onClose={onClose}>
      <div className="space-y-3.5 max-h-[60vh] overflow-y-auto px-1">
        {error && <div className="flex items-start gap-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium"><AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium"><CheckCircle size={14} /> Registro exitoso de credenciales.</div>}

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nombre Completo *</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Carlos Mendoza" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#014ba0]" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email de Acceso *</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#014ba0]" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contraseña Provisional *</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#014ba0]" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Rol asignado</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { val: "usuario", label: "Usuario", Icon: User },
              { val: "tecnico", label: "Técnico", Icon: Briefcase },
              { val: "admin", label: "Admin", Icon: Shield },
            ].map(r => (
              <button key={r.val} type="button" onClick={() => setRol(r.val)} className={`py-2 rounded-xl border text-[11px] font-bold transition-all text-center ${rol === r.val ? "bg-[#014ba0] text-white border-[#014ba0]" : "bg-slate-50 text-slate-500 border-slate-200"}`} >
                <r.Icon size={14} className="mx-auto mb-1" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Departamento corporativo</label>
          <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#014ba0]" >
            <option value="">Sin departamento asignado</option>
            {deptos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
      </div>
      <ModalFooter loading={loading} onClose={onClose} onSave={save} label="Crear Usuario" />
    </ModalShell>
  );
}

// ─── MODAL: CATEGORÍAS INDIVIDUALES ─────────────────────────────────────────
function ModalCategoria({ isOpen, item, onClose, onSaved }: { isOpen: boolean; item: any; onClose: () => void; onSaved: () => void; }) {
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNombre(item?.nombre ?? "");
    setDesc(item?.descripcion ?? "");
  }, [item, isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    if (!nombre.trim()) return alert("Nombre obligatorio.");
    setLoading(true);
    const payload = { nombre: nombre.trim(), descripcion: descripcion.trim() || null };
    item ? await supabase.from("categorias").update(payload).eq("id", item.id) : await supabase.from("categorias").insert([payload]);
    setLoading(false); onSaved(); onClose();
  };

  return (
    <ModalShell title={item ? "Modificar Categoría" : "Añadir Categoría"} Icon={Tag} onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Nombre identificador" value={nombre} onChange={setNombre} placeholder="Ej. Laptops, Servidores..." />
        <Field label="Breve Descripción" value={descripcion} onChange={setDesc} placeholder="Especificaciones opcionales..." />
      </div>
      <ModalFooter loading={loading} onClose={onClose} onSave={save} label={item ? "Guardar" : "Crear"} />
    </ModalShell>
  );
}

// ─── MODAL: DEPARTAMENTOS INDIVIDUALES ───────────────────────────────────────
function ModalDepartamento({ isOpen, item, onClose, onSaved }: { isOpen: boolean; item: any; onClose: () => void; onSaved: () => void; }) {
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDesc] = useState("");
  const [responsable, setResponsable] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNombre(item?.nombre ?? "");
    setDesc(item?.descripcion ?? "");
    setResponsable(item?.responsable ?? "");
  }, [item, isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    if (!nombre.trim()) return alert("El nombre del departamento es requerido.");
    setLoading(true);
    const payload = { nombre: nombre.trim(), descripcion: descripcion.trim() || null, responsable: responsable.trim() || null };
    item ? await supabase.from("departamentos").update(payload).eq("id", item.id) : await supabase.from("departamentos").insert([payload]);
    setLoading(false); onSaved(); onClose();
  };

  return (
    <ModalShell title={item ? "Modificar Área" : "Añadir Área"} Icon={Building2} onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Nombre del Área" value={nombre} onChange={setNombre} placeholder="Ej. Logística, IT..." />
        <Field label="Líder / Responsable" value={responsable} onChange={setResponsable} placeholder="Nombre del encargado..." />
        <Field label="Descripción" value={descripcion} onChange={setDesc} placeholder="Detalles de operaciones..." />
      </div>
      <ModalFooter loading={loading} onClose={onClose} onSave={save} label={item ? "Guardar" : "Crear"} />
    </ModalShell>
  );
}

// ─── COMPONENTES ATÓMICOS COMPARTIDOS (UI/UX) ──────────────────────────────────
function ModalShell({ title, Icon, onClose, children }: { title: string; Icon: any; onClose: () => void; children: React.ReactNode; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[calc(100vh-3rem)] flex flex-col z-10 border border-slate-100 animate-fade-in-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#014ba0] rounded-xl text-white">
              <Icon size={15} />
            </div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 bg-white">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
      />
    </div>
  );
}

function ModalFooter({ loading, onClose, onSave, label }: { loading: boolean; onClose: () => void; onSave: () => void; label: string; }) {
  return (
    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
      <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-all" >
        Cancelar
      </button>
      <button type="button" onClick={onSave} disabled={loading} className="flex items-center gap-1.5 bg-[#014ba0] hover:bg-[#004091] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 transition-all" >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        <span>{label}</span>
      </button>
    </div>
  );
}