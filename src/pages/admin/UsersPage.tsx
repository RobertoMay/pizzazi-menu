import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, ChevronDown, Eye, EyeOff, Key, Plus, Shield, Trash2 } from 'react-feather';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import CouponPermsModal from '../../components/admin/CouponPermsModal';
import UserModal from '../../components/admin/UserModal';
import { useAuth } from '../../contexts/AuthContext';
import { usePush } from '../../hooks/usePush';
import {
  deleteUser, getBranches, getPushSettings, getUsers,
  toggleUser, updatePushSettings,
} from '../../services/api';

interface Branch { _id: string; name: string; }

interface CouponPerms {
  enabled?: boolean;
  allowedTypes?: string[];
  maxDiscountPct?: number;
  maxFixedAmount?: number | null;
  workingHoursOnly?: boolean;
  workingHours?: { from?: string; to?: string };
  maxCouponsPerDay?: number | null;
}

interface User {
  _id: string; name: string; username: string;
  role: 'admin' | 'editor';
  branch?: { _id: string; name: string } | null;
  active: boolean;
  couponPerms?: CouponPerms;
}

const ROLE_CONFIG = {
  superadmin: { label: 'Super Admin', bg: 'rgba(248,67,49,0.15)',  color: '#F84331' },
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
  const push         = usePush();

  const [branches,       setBranches]       = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [users,          setUsers]          = useState<User[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [modal,          setModal]          = useState<ModalState>(null);
  const [permsTarget,    setPermsTarget]    = useState<User | null>(null);
  const [confirmDialog,  setConfirmDialog]  = useState<{ message: string; onConfirm: () => Promise<void> } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Notification settings (superadmin only)
  const [notifEnabled,   setNotifEnabled]   = useState(true);
  const [excludedUsers,  setExcludedUsers]  = useState<string[]>([]);
  const [notifLoading,   setNotifLoading]   = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getBranches().then((data: Branch[]) => setBranches(data));
    getPushSettings().then(s => {
      setNotifEnabled(s.enabled);
      setExcludedUsers(s.excludedUsers);
    }).catch(() => {});
  }, [isSuperAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (isSuperAdmin && selectedBranch) params.branch = selectedBranch;
      const data = await getUsers(params);
      setUsers(data);
    } finally { setLoading(false); }
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
    try { await confirmDialog.onConfirm(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error al completar la acción'); }
    finally { setConfirmLoading(false); setConfirmDialog(null); }
  };

  // Toggle global notifications on/off
  const handleNotifToggle = async () => {
    setNotifLoading(true);
    try {
      const next = !notifEnabled;
      await updatePushSettings({ enabled: next });
      setNotifEnabled(next);
      toast.success(next ? 'Notificaciones activadas' : 'Notificaciones pausadas');
    } catch { toast.error('Error al actualizar'); }
    finally { setNotifLoading(false); }
  };

  // Subscribe to push notifications
  const handleSubscribe = async () => {
    setNotifLoading(true);
    const ok = await push.subscribe();
    setNotifLoading(false);
    if (ok) toast.success('Notificaciones activadas');
    else if (push.permission === 'denied') toast.error('Permiso denegado. Actívalo en la configuración del navegador.');
    else toast.error('No se pudo activar. Intenta de nuevo.');
  };

  // Toggle user exclusion
  const handleToggleExclude = async (userId: string) => {
    const next = excludedUsers.includes(userId)
      ? excludedUsers.filter(id => id !== userId)
      : [...excludedUsers, userId];
    try {
      await updatePushSettings({ excludedUsers: next });
      setExcludedUsers(next);
    } catch { toast.error('Error al actualizar'); }
  };

  const targetRole = isSuperAdmin ? 'Admin' : 'Editor';

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-white text-2xl font-bold">Usuarios</h1>
        <div className="flex items-center gap-3">
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

      {/* Push notification panel — superadmin only */}
      {isSuperAdmin && push.supported && (
        <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Bell size={16} className={push.subscribed && notifEnabled ? 'text-green-400' : 'text-gray-500'} />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Notificaciones push</p>
            <p className="text-gray-500 text-xs">
              {!push.subscribed
                ? 'Recibe alertas cuando un editor genere un cupón'
                : notifEnabled
                  ? 'Activas — te llegará una alerta por cada cupón generado'
                  : 'Pausadas — no recibirás alertas por ahora'}
            </p>
          </div>
          {!push.subscribed ? (
            <button
              onClick={handleSubscribe}
              disabled={notifLoading || push.loading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50 flex-shrink-0"
              style={{ background: '#4ade80', color: '#000' }}>
              {push.loading ? '...' : 'Activar'}
            </button>
          ) : (
            <button
              onClick={handleNotifToggle}
              disabled={notifLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50 flex-shrink-0"
              style={{
                background: notifEnabled ? 'rgba(248,67,49,0.15)' : 'rgba(74,222,128,0.15)',
                color: notifEnabled ? '#f87171' : '#4ade80',
                border: `1px solid ${notifEnabled ? 'rgba(248,67,49,0.3)' : 'rgba(74,222,128,0.3)'}`,
              }}>
              {notifEnabled ? 'Pausar' : 'Reactivar'}
            </button>
          )}
        </div>
      )}

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
            const roleCfg   = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.editor;
            const isExcl    = excludedUsers.includes(u._id);
            const hasPerms  = u.couponPerms?.enabled;
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
                    {hasPerms && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                        Cupones ✓
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm truncate">
                    @{u.username}
                    {u.branch && <span className="text-gray-600"> · {u.branch.name}</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Mute notifications — superadmin only */}
                  {isSuperAdmin && push.subscribed && (
                    <button
                      onClick={() => handleToggleExclude(u._id)}
                      className="p-2 rounded-xl transition-colors"
                      style={{
                        background: isExcl ? 'rgba(248,67,49,0.1)' : 'rgba(255,255,255,0.05)',
                        color: isExcl ? '#f87171' : '#6b7280',
                      }}
                      title={isExcl ? 'Notificaciones silenciadas' : 'Silenciar notificaciones'}>
                      {isExcl ? <BellOff size={15} /> : <Bell size={15} />}
                    </button>
                  )}

                  {/* Coupon perms */}
                  <button
                    onClick={() => setPermsTarget(u)}
                    className="p-2 rounded-xl text-gray-400 hover:text-blue-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    title="Permisos de cupones">
                    <Shield size={15} />
                  </button>

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

      {/* Modals */}
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

      {permsTarget && (
        <CouponPermsModal
          user={permsTarget}
          onClose={() => setPermsTarget(null)}
          onSaved={perms => {
            setUsers(prev => prev.map(u =>
              u._id === permsTarget._id ? { ...u, couponPerms: perms } : u
            ));
            setPermsTarget(null);
          }}
        />
      )}

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
