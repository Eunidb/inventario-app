
interface ModalConfirmarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensaje: string;
  tipo?: "danger" | "info";
}

export default function ModalConfirmar({ 
  isOpen, onClose, onConfirm, titulo, mensaje, tipo = "danger" 
}: ModalConfirmarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
            tipo === "danger" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
          }`}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{mensaje}</p>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-2">
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${
              tipo === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Confirmar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}