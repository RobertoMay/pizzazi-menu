import { FormEvent, useEffect, useState, useRef } from 'react';
import { AlertTriangle, CheckCircle, Eye, EyeOff, Loader, X } from 'react-feather';
import { toast } from 'sonner';
import { changeUserPassword, createUser, getUsers } from '../../services/api';

type Mode = 'create' | 'password';
type NewRole = 'admin' | 'editor';

interface Branch { _id: string; name: string; }
interface Props {
  mode: Mode;
  targetUser?: { _id: string; name: string };
  branches?: Branch[];
  isSuperAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const fieldStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const fieldClass = 'w-full rounded-xl px-4 py-3 text-white text-base outline-none transition-all';
const focusRed = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = '#F84331'; };
const blurGray = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; };

function PassInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  const inputType = show ? 'text' : (value.length > 0 ? 'password' : 'text');
  return (
    <div>
      <label className="block text-gray-300 text-sm mb-2">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          placeholder="Mínimo 6 caracteres"
          className={`${fieldClass} pr-11 placeholder-gray-600`}
          style={{ ...fieldStyle }}
          onFocus={focusRed}
          onBlur={blurGray}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function UserModal({ mode, targetUser, branches, isSuperAdmin, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [newRole, setNewRole] = useState<NewRole>('admin');
  const [branch, setBranch] = useState(branches?.[0]?._id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin availability check
  const [checking, setChecking] = useState(false);
  const [existingAdmin, setExistingAdmin] = useState<string | null>(null); // name of existing admin or null
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Check if selected branch already has an admin whenever branch or role changes
  useEffect(() => {
    if (!isSuperAdmin || newRole !== 'admin' || !branch) {
      setExistingAdmin(null);
      return;
    }
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    setChecking(true);
    setExistingAdmin(null);
    checkTimeout.current = setTimeout(async () => {
      try {
        const users = await getUsers({ branch });
        const admin = users.find((u: { role: string; name: string }) => u.role === 'admin');
        setExistingAdmin(admin ? admin.name : null);
      } catch {
        setExistingAdmin(null);
      } finally {
        setChecking(false);
      }
    }, 300);
    return () => { if (checkTimeout.current) clearTimeout(checkTimeout.current); };
  }, [branch, newRole, isSuperAdmin]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (existingAdmin) return;
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setError('');
    setLoading(true);
    try {
      if (mode === 'create') {
        const payload: Record<string, string> = {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
        };
        if (isSuperAdmin) {
          payload.branch = branch;
          payload.role = newRole;
        }
        await createUser(payload);
        toast.success('Usuario creado');
      } else {
        await changeUserPassword(targetUser!._id, password);
        toast.success('Contraseña actualizada');
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'create'
    ? (isSuperAdmin ? 'Nuevo usuario' : 'Nuevo editor')
    : `Cambiar contraseña — ${targetUser?.name}`;

  const branchBlocked = isSuperAdmin && newRole === 'admin' && !!existingAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-sm rounded-2xl"
        style={{
          background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

          {mode === 'create' && (
            <>
              {isSuperAdmin && branches && branches.length > 0 && (
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Sucursal *</label>
                  <div className="relative">
                    <select value={branch} onChange={e => setBranch(e.target.value)} required
                      className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-white text-base outline-none"
                      style={fieldStyle}>
                      {branches.map(b => (
                        <option key={b._id} value={b._id} style={{ background: '#1c1c2e' }}>{b.name}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              )}

              {isSuperAdmin && (
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Rol</label>
                  <div className="flex gap-2">
                    {(['admin', 'editor'] as NewRole[]).map(r => (
                      <button key={r} type="button" onClick={() => setNewRole(r)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: newRole === r ? '#F84331' : 'rgba(255,255,255,0.06)',
                          color: newRole === r ? '#fff' : '#9ca3af',
                        }}>
                        {r === 'admin' ? 'Administrador' : 'Editor'}
                      </button>
                    ))}
                  </div>

                  {/* Real-time admin availability indicator */}
                  <div className="mt-2 min-h-[20px]">
                    {newRole === 'admin' && checking && (
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Loader size={12} className="animate-spin" />
                        Verificando disponibilidad...
                      </span>
                    )}
                    {newRole === 'admin' && !checking && existingAdmin && (
                      <span className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: '#fb923c' }}>
                        <AlertTriangle size={13} />
                        Esta sucursal ya tiene admin: <strong>{existingAdmin}</strong>
                      </span>
                    )}
                    {newRole === 'admin' && !checking && !existingAdmin && branch && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                        <CheckCircle size={13} />
                        Sucursal disponible para asignar admin
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-300 text-sm mb-2">Nombre *</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Nombre completo"
                  className={`${fieldClass} placeholder-gray-600`} style={{ ...fieldStyle }}
                  onFocus={focusRed} onBlur={blurGray} />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Usuario *</label>
                <input value={username} onChange={e => setUsername(e.target.value.toLowerCase())} required
                  placeholder="usuario123"
                  className={`${fieldClass} placeholder-gray-600`} style={{ ...fieldStyle }}
                  onFocus={focusRed} onBlur={blurGray} />
              </div>
            </>
          )}

          <PassInput
            label={mode === 'create' ? 'Contraseña *' : 'Nueva contraseña *'}
            value={password}
            onChange={setPassword}
          />
          <PassInput
            label="Confirmar contraseña *"
            value={confirm}
            onChange={setConfirm}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-base font-semibold text-gray-300"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || branchBlocked}
              className="flex-1 py-3 rounded-xl text-base font-bold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: '#F84331' }}>
              {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Cambiar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
