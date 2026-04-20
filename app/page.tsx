import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      
      {/* SECCIÓN IZQUIERDA: Contenido y Footer */}
      <div className="w-full md:w-2/5 flex flex-col min-h-screen border-r border-gray-50">
        
        {/* Espaciador superior para empujar el contenido al centro */}
        <div className="flex-grow flex flex-col justify-center px-8 md:px-16">
          <div className="max-w-sm mx-auto md:mx-0 w-full">
            {/* Logo y Título */}
            <div className="mb-8 text-center md:text-left">
              <div className="inline-block p-2 bg-blue-50 rounded-lg mb-4 text-blue-600">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                 </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Bienvenido
              </h1>
              <p className="text-gray-500 mt-2">
                Accede al panel de Laboratorios Pier
              </p>
            </div>

            {/* Botones de Acción - Más compactos */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] transition-all duration-200"
              >
                Iniciar Sesión
              </Link>

              <Link
                href="/register"
                className="flex items-center justify-center w-full px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 hover:border-blue-200 transition-all duration-200"
              >
                Crear una cuenta
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Mejorado - Ubicado al fondo */}
        <div className="p-8 border-t border-gray-50 text-xs text-gray-400 text-center md:text-left">
          <div className="max-w-sm mx-auto md:mx-0">
            <p className="font-medium text-gray-500">
              © 2026 Sistema de Inventario Laboratorios Pier.
            </p>
            <p className="mt-1">Depto. Mantenimiento & Infraestructura</p>
            <div className="flex gap-4 mt-3 justify-center md:justify-start">
              <a href="#" className="hover:text-blue-500 transition-colors">Soporte Técnico</a>
              <span className="text-gray-200">|</span>
              <a href="#" className="hover:text-blue-500 transition-colors">Privacidad</a>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Visual / Degradado */}
      <div className="hidden md:flex md:w-3/5 bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950 items-center justify-center relative overflow-hidden">
        {/* Elementos visuales de fondo */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full opacity-10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500 rounded-full opacity-10 blur-[80px]"></div>

        <div className="relative z-10 text-center px-12">
          <div className="mb-8 flex justify-center drop-shadow-2xl">
              <svg className="w-56 h-56 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Control de inventario,<br/>
            <span className="text-blue-300">Depto. Mantenimiento</span>
          </h2>
          <p className="text-blue-100/70 text-lg max-w-sm mx-auto font-light">
            Gestión de stock e infraestructura técnica en tiempo real.
          </p>
        </div>
      </div>

    </div>
  );
}