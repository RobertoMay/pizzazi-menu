import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Eye, EyeOff, Key, Plus, Trash2 } from 'react-feather';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import UserModal from '../../components/admin/UserModal';
import { useAuth } from '../../contexts/AuthContext';
import { deleteUser, getBranches, getUsers, toggleUser } from '../../services/api';

interface Branch { _id: string; name: string; }
interface User {
  _id: string; name: string; username: string;
  role: 'admin' | 'editor';
  branch?: { _id: string; name: string } | null;
  active: boolean;
}

const ROLE_CONFIG = {
  superadmin: { label: 'Super Admin', bg: 'rgba(248,67,49,0.15)', color: '#F84331' },
  admin:      { label: 'Admin',       bg: 'rgba(250,204,21,0.15)', color: '#FACC15' },
  editor:     { label: 'Editor',      bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

type ModalState =
  | { type: 'create' }
  | { type: 'password'; user: User }
  | null;

export default function UsersPage() {
  const { user: me } = useAuth();
  const isSuperAdmin = me?.role === 'superadmin';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => Promise<void> } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getBranches().then((data: Branch[]) => {
      setBranches(data);
    });
  }, [isSuperAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (isSuperAdmin && selectedBranch) params.branch = selectedBranch;
      const data = await getUsers(params);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, selectedBranch]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (u: User) => {
    try {
      await toggleUser(u._id);
      setUsers(ps => ps.map(p => {
        if (p._id !== u._id) return p;
        const next = !p.active;
        toast.success(next ? 'Usuario activado' : 'Usuario desactivado');
        return { ...p, active: next };
      }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar usuario');
    }
  };

  const handleDelete = (u: User) => {
    setConfirmDialog({
      message: `El usuario "${u.name}" (@${u.username}) será eliminado permanentemente.`,
      onConfirm: async () => {
        await deleteUser(u._id);
        setUsers(ps => ps.filter(p => p._id !== u._id));
        toast.success('Usuario eliminado');
      },
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al completar la acción');
    } finally {
      setConfirmLoading(false);
      setConfirmDialog(null);
    }
  };

  const targetRole = isSuperAdmin ? 'Admin' : 'Editor';

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-white text-2xl font-bold">Usuarios</h1>
        <div className="flex items-center gap-3">
          {/* Branch filter for superadmin */}
          {isSuperAdmin && (
            <div className="relative">
              <select
                value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                className="appearance-none text-white text-base rounded-xl px-4 py-2.5 pr-9 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="" style={{ background: '#1c1c2e' }}>Todas las sucursales</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id} style={{ background: '#1c1c2e' }}>{b.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 flex-shrink-0"
            style={{ background: '#F84331' }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Info banner for superadmin */}
      {isSuperAdmin && (
        <div className="mb-5 rounded-xl px-4 py-3 text-sm text-gray-400"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          Como <span className="text-white font-semibold">Super Admin</span> gestionas los administradores de cada sucursal. Cada sucursal puede tener un solo admin, quien a su vez gestiona a sus editores.
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-500 py-16 animate-pulse">Cargando usuarios...</p>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-3 text-lg">No hay {targetRole.toLowerCase()}s todavía</p>
          <button onClick={() => setModal({ type: 'create' })}
            className="text-sm font-semibold hover:opacity-80" style={{ color: '#F84331' }}>
            + Crear el primero
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => {
            const roleCfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.editor;
            return (
              <div
                key={u._id}
                className="rounded-2xl p-4 flex items-center gap-4 transition-all"
                style={{
                  background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: u.active ? 1 : 0.5,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-base font-black"
                  style={{ background: roleCfg.bg, color: roleCfg.color }}
                >
                  {getInitials(u.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-white font-bold text-base leading-tight">{u.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: roleCfg.bg, color: roleCfg.color }}>
                      {roleCfg.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: u.active ? 'rgba(74,222,128,0.1)' : 'rgba(248,67,49,0.1)',
                        color: u.active ? '#4ade80' : '#f87171',
                      }}>
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm truncate">
                    @{u.username}
                    {u.branch && <span className="text-gray-600"> · {u.branch.name}</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggle(u)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    title={u.active ? 'Desactivar' : 'Activar'}>
                    {u.active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => setModal({ type: 'password', user: u })}
                    className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    title="Cambiar contraseña">
                    <Key size={16} />
                  </button>
                  <button onClick={() => handleDelete(u)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User modal */}
      {modal && (
        <UserModal
          mode={modal.type}
          targetUser={modal.type === 'password' ? modal.user : undefined}
          branches={isSuperAdmin ? branches : undefined}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {/* Confirm modal */}
      {confirmDialog && (
        <ConfirmModal
          message={confirmDialog.message}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDialog(null)}
          loading={confirmLoading}
        />
      )}
    </AdminLayout>
  );
}
