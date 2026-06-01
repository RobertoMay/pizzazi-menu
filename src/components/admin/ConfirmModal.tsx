import { useEffect } from 'react';
import { AlertTriangle } from 'react-feather';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ message, onConfirm, onCancel, loading }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      <div
        className="relative w-full max-w-sm rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4"
          style={{ background: 'rgba(248,67,49,0.12)' }}>
          <AlertTriangle size={22} style={{ color: '#F84331' }} />
        </div>

        <p className="text-white text-base font-semibold mb-1">¿Estás seguro?</p>
        <p className="text-gray-400 text-sm mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-base font-semibold text-gray-300 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#F84331' }}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
