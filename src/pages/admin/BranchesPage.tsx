import { useEffect, useState } from 'react';
import { Edit2, Eye, EyeOff, MapPin, Phone, Plus, Trash2 } from 'react-feather';
import { getAllBranches, toggleBranch, deleteBranch } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import BranchModal from '../../components/admin/BranchModal';
import ConfirmModal from '../../components/admin/ConfirmModal';

interface Branch {
  _id: string;
  name: string;
  slug: string;
  address?: string;
  phones?: string[];
  active: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: 'create' } | { type: 'edit'; branch: Branch } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllBranches();
      setBranches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (b: Branch) => {
    try {
      await toggleBranch(b._id);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleDelete = (b: Branch) => {
    setConfirmDialog({
      message: `¿Eliminar "${b.name}"? Se eliminarán también todos sus productos, categorías y promociones. Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        await deleteBranch(b._id);
        load();
      },
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <AdminLayout>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-white text-2xl font-bold">Sucursales</h1>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ background: '#F84331' }}
          >
            <Plus size={16} />
            <span>Nueva sucursal</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-gray-500 animate-pulse">Cargando sucursales...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <MapPin size={40} className="text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg font-semibold">No hay sucursales</p>
            <p className="text-gray-600 text-sm mt-1">Crea la primera para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branches.map(b => (
              <div
                key={b._id}
                className="rounded-2xl px-5 py-5"
                style={{
                  background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
                  border: `1px solid ${b.active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                  opacity: b.active ? 1 : 0.6,
                }}
              >
                {/* Name + badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base leading-tight truncate">{b.name}</h3>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
                      /{b.slug}
                    </span>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: b.active ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)',
                      color: b.active ? '#4ade80' : '#6b7280',
                    }}
                  >
                    {b.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Address */}
                {b.address && (
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin size={13} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-400 text-sm leading-snug">{b.address}</p>
                  </div>
                )}

                {/* Phones */}
                {b.phones && b.phones.length > 0 && (
                  <div className="flex items-start gap-2 mb-2">
                    <Phone size={13} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {b.phones.map((ph, i) => (
                        <span key={i} className="text-gray-400 text-sm">{ph}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => handleToggle(b)}
                    title={b.active ? 'Desactivar' : 'Activar'}
                    className="p-2 rounded-xl transition-colors hover:text-white text-gray-400"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {b.active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => setModal({ type: 'edit', branch: b })}
                    title="Editar"
                    className="p-2 rounded-xl transition-colors hover:text-white text-gray-400"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(b)}
                    title="Eliminar"
                    className="p-2 rounded-xl transition-colors hover:text-red-400 text-gray-400 ml-auto"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      {modal && (
        <BranchModal
          branch={modal.type === 'edit' ? modal.branch : undefined}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {confirmDialog && (
        <ConfirmModal
          message={confirmDialog.message}
          loading={confirmLoading}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </AdminLayout>
  );
}
