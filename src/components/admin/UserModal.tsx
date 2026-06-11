import { FormEvent, useEffect, useRef, useState } from 'react';
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

const COUPON_TYPES = [
  { key: 'percentage',   label: '% Descuento' },
  { key: 'fixed_amount', label: '$ Monto fijo' },
  { key: '2x1',          label: '2×1' },
  { key: 'free_item',    label: 'Producto gratis' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="w-10 h-5.5 rounded-full transition-colors flex-shrink-0 relative"
      style={{ background: value ? '#4ade80' : 'rgba(255,255,255,0.12)', height: '22px', width: '40px' }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: value ? '20px' : '2px' }} />
    </button>
  );
}

function PassInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-gray-300 text-sm mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : (value.length > 0 ? 'password' : 'text')}
          value={value} onChange={e => onChange(e.target.value)} required
          placeholder="Mínimo 6 caracteres"
          className={`${fieldClass} pr-11 placeholder-gray-600`}
          style={{ ...fieldStyle }} onFocus={focusRed} onBlur={blurGray}
        />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function UserModal({ mode, targetUser, branches, isSuperAdmin, onClose, onSaved }: Props) {
  const [name,     setName]     = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [newRole,  setNewRole]  = useState<NewRole>('admin');
  const [branch,   setBranch]   = useState(branches?.[0]?._id ?? '');
  const [loading,  setLoading]  = useState(false);

  // Admin availability check
  const [checking,      setChecking]      = useState(false);
  const [existingAdmin, setExistingAdmin] = useState<string | null>(null);
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coupon perms state (for editor role)
  const [cpEnabled,     setCpEnabled]     = useState(true);
  const [cpTypes,       setCpTypes]       = useState<string[]>(['percentage', 'fixed_amount', '2x1', 'free_item']);
  const [cpMaxPct,      setCpMaxPct]      = useState('100');
  const [cpMaxFixed,    setCpMaxFixed]    = useState('');
  const [cpPerDay,      setCpPerDay]      = useState('');
  const [cpHoursOnly,   setCpHoursOnly]   = useState(false);
  const [cpFrom,        setCpFrom]        = useState('08:00');
  const [cpTo,          setCpTo]          = useState('22:00');

  const showCouponPerms = mode === 'create';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!isSuperAdmin || newRole !== 'admin' || !branch) {
      setExistingAdmin(null); return;
    }
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    setChecking(true); setExistingAdmin(null);
    checkTimeout.current = setTimeout(async () => {
      try {
        const users = await getUsers({ branch });
        const admin = users.find((u: { role: string; name: string }) => u.role === 'admin');
        setExistingAdmin(admin ? admin.name : null);
      } catch { setExistingAdmin(null); }
      finally { setChecking(false); }
    }, 300);
    return () => { if (checkTimeout.current) clearTimeout(checkTimeout.current); };
  }, [branch, newRole, isSuperAdmin]);

  const toggleCpType = (key: string) =>
    setCpTypes(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (existingAdmin) return;
    if (password !== confirm) { toast.error('Las contraseñas no coinciden'); return; }
    if (password.length < 6)  { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      if (mode === 'create') {
        const payload: Record<string, unknown> = {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
        };
        if (isSuperAdmin) { payload.branch = branch; payload.role = newRole; }

        if (showCouponPerms) {
          payload.couponPerms = {
            enabled:          cpEnabled,
            allowedTypes:     cpTypes,
            maxDiscountPct:   cpMaxPct   ? Number(cpMaxPct)   : 100,
            maxFixedAmount:   cpMaxFixed ? Number(cpMaxFixed) : null,
            maxCouponsPerDay: cpPerDay   ? Number(cpPerDay)   : null,
            workingHoursOnly: cpHoursOnly,
            workingHours:     cpHoursOnly ? { from: cpFrom, to: cpTo } : {},
          };
        }

        await createUser(payload);
        toast.success('Usuario creado');
      } else {
        await changeUserPassword(targetUser!._id, password);
        toast.success('Contraseña actualizada');
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const title = mode === 'create'
    ? (isSuperAdmin ? 'Nuevo usuario' : 'Nuevo editor')
    : `Cambiar contraseña — ${targetUser?.name}`;

  const branchBlocked = isSuperAdmin && newRole === 'admin' && !!existingAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm sm:max-w-2xl rounded-2xl flex flex-col max-h-[92dvh]"
        style={{ background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

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
                    <div className="mt-2 min-h-[20px]">
                      {newRole === 'admin' && checking && (
                        <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                          <Loader size={12} className="animate-spin" />
                          Verificando disponibilidad...
                        </span>
                      )}
                      {newRole === 'admin' && !checking && existingAdmin && (
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#fb923c' }}>
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

                <div className="grid sm:grid-cols-2 gap-4">
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
                </div>
              </>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <PassInput label={mode === 'create' ? 'Contraseña *' : 'Nueva contraseña *'} value={password} onChange={setPassword} />
              <PassInput label="Confirmar contraseña *" value={confirm} onChange={setConfirm} />
            </div>

            {/* ── Coupon perms section ── */}
            {showCouponPerms && (
              <div className="rounded-xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Permisos de cupones</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{cpEnabled ? 'Habilitado' : 'Deshabilitado'}</span>
                    <Toggle value={cpEnabled} onChange={setCpEnabled} />
                  </div>
                </div>

                {cpEnabled && (
                  <div className="sm:grid sm:grid-cols-2 sm:gap-x-6 space-y-4 sm:space-y-0">

                    {/* Columna izquierda */}
                    <div className="space-y-4">
                      {/* Tipos permitidos */}
                      <div>
                        <p className="text-gray-500 text-xs mb-2">
                          Tipos permitidos <span className="text-gray-600">(vacío = todos)</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {COUPON_TYPES.map(t => {
                            const active = cpTypes.includes(t.key);
                            return (
                              <button key={t.key} type="button" onClick={() => toggleCpType(t.key)}
                                className="py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all"
                                style={{
                                  background: active ? 'rgba(248,67,49,0.15)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${active ? 'rgba(248,67,49,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                  color: active ? '#f87171' : '#6b7280',
                                }}>
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Límites numéricos */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-500 text-xs block mb-1">Máx. % descuento</label>
                          <input type="number" min="1" max="100" value={cpMaxPct} onChange={e => setCpMaxPct(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" placeholder="100"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div>
                          <label className="text-gray-500 text-xs block mb-1">Máx. monto fijo $</label>
                          <input type="number" min="0" value={cpMaxFixed} onChange={e => setCpMaxFixed(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" placeholder="Sin límite"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                      </div>
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-4 mt-4 sm:mt-0">
                      {/* Límite diario */}
                      <div>
                        <label className="text-gray-500 text-xs block mb-1">
                          Cupones por día <span className="text-gray-600">(vacío = sin límite)</span>
                        </label>
                        <input type="number" min="1" value={cpPerDay} onChange={e => setCpPerDay(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" placeholder="Sin límite"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>

                      {/* Horario */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-500 text-xs">Solo en horario laboral</p>
                          <Toggle value={cpHoursOnly} onChange={setCpHoursOnly} />
                        </div>
                        {cpHoursOnly && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-gray-600 text-xs block mb-1">Desde</label>
                              <input type="time" value={cpFrom} onChange={e => setCpFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
                            </div>
                            <div>
                              <label className="text-gray-600 text-xs block mb-1">Hasta</label>
                              <input type="time" value={cpTo} onChange={e => setCpTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
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
