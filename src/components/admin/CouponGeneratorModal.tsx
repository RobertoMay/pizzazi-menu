import { useState, useEffect, useRef } from 'react';
import { X, Search, User, UserPlus } from 'react-feather';
import { createCoupon, getCustomers, createCustomer, getAllBranches } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Customer { _id: string; name: string; phone: string; }
interface Branch   { _id: string; name: string; }
interface Props {
  prefillCustomer?: { _id: string; name: string; phone: string } | null;
  onClose: () => void;
  onCreated: (result: unknown) => void;
}

const toInputDate = (d: Date) => d.toISOString().split('T')[0];
const today      = toInputDate(new Date());
const monthLater = toInputDate(new Date(Date.now() + 30 * 86400 * 1000));

const DAYS = [
  { label: 'Lun', value: 1 }, { label: 'Mar', value: 2 }, { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 }, { label: 'Vie', value: 5 }, { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];
const APPLY = [
  { label: '🍽️ Comedor',     value: 'dine_in'  },
  { label: '🛵 Domicilio',   value: 'delivery' },
  { label: '🥡 Para llevar', value: 'pickup'   },
];
const TYPES = [
  { value: 'percentage',   label: '% Descuento', icon: '%'  },
  { value: 'fixed_amount', label: '$ Monto fijo', icon: '$' },
  { value: '2x1',          label: '2×1',          icon: '×' },
  { value: 'free_item',    label: 'Gratis',        icon: '🎁' },
];

const inp = 'w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-red-500/40';
const inpStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const section = 'space-y-3 border-t pt-5';
const sectionStyle = { borderColor: 'rgba(255,255,255,0.06)' };

export default function CouponGeneratorModal({ prefillCustomer, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  // ── Sucursal (superadmin selecciona, otros usan la suya) ──
  const [branch,   setBranch]   = useState(isSuperAdmin ? '' : (user?.branch?._id ?? ''));
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      getAllBranches().then((data: Branch[]) => {
        const active = data.filter((b: Branch & { active?: boolean }) => b.active !== false);
        setBranches(active);
        if (active.length > 0) setBranch(active[0]._id);
      });
    }
  }, [isSuperAdmin]);

  // ── Cliente ──
  const [customer,     setCustomer]     = useState<Customer | null>(prefillCustomer ?? null);
  const [custSearch,   setCustSearch]   = useState('');
  const [custResults,  setCustResults]  = useState<Customer[]>([]);
  const [custLoading,  setCustLoading]  = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Creación inline de cliente
  const [inlineCreate,  setInlineCreate]  = useState(false);
  const [newName,       setNewName]       = useState('');
  const [newPhone,      setNewPhone]      = useState('');
  const [savingCust,    setSavingCust]    = useState(false);
  const [custCreateErr, setCustCreateErr] = useState('');

  const looksLikePhone = (s: string) => /^\d[\d\s\-()]*$/.test(s.trim());

  const openInlineCreate = () => {
    setInlineCreate(true);
    setShowDropdown(false);
    setNewPhone(looksLikePhone(custSearch) ? custSearch.trim().replace(/\D/g, '') : '');
    setNewName('');
    setCustCreateErr('');
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) { setCustCreateErr('Nombre y teléfono son requeridos'); return; }
    if (!branch) { setCustCreateErr('Selecciona una sucursal primero'); return; }
    setSavingCust(true);
    setCustCreateErr('');
    try {
      const created = await createCustomer({ name: newName.trim(), phone: newPhone.trim(), branch });
      setCustomer(created);
      setInlineCreate(false);
      setCustSearch('');
    } catch (err: unknown) {
      setCustCreateErr(err instanceof Error ? err.message : 'Error al crear cliente');
    } finally {
      setSavingCust(false);
    }
  };

  // Búsqueda de clientes filtrada por sucursal
  useEffect(() => {
    if (custSearch.length < 1) { setCustResults([]); return; }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      setCustLoading(true);
      try {
        const params: Record<string,string> = { q: custSearch };
        if (isSuperAdmin && branch) params.branch = branch;
        setCustResults(await getCustomers(params));
      } finally { setCustLoading(false); }
    }, 300);
  }, [custSearch, branch, isSuperAdmin]);

  // ── Descuento ──
  const [discountType,  setDiscountType]  = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [description,   setDescription]  = useState('');

  // ── Dónde aplica ──
  const [applyTo, setApplyTo] = useState<string[]>(['dine_in', 'delivery', 'pickup']);
  const toggleApply = (v: string) =>
    setApplyTo(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  // ── Vigencia ──
  const [validFrom,  setValidFrom]  = useState(today);
  const [validUntil, setValidUntil] = useState(monthLater);
  const [validDays,  setValidDays]  = useState<number[]>([]);
  const toggleDay = (v: number) =>
    setValidDays(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const [useHours,  setUseHours]  = useState(false);
  const [hoursFrom, setHoursFrom] = useState('09:00');
  const [hoursTo,   setHoursTo]   = useState('21:00');

  // ── Límite de uso ──
  const [useLimit, setUseLimit] = useState('once');

  // ── Submit ──
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const needsValue = discountType === 'percentage' || discountType === 'fixed_amount';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!branch)   return setError('Selecciona una sucursal');
    if (!customer) return setError('Selecciona un cliente');
    if (applyTo.length === 0) return setError('Selecciona al menos un lugar de aplicación');
    if (needsValue && !discountValue) return setError('Ingresa el valor del descuento');
    if (validUntil <= validFrom) return setError('La fecha final debe ser posterior a la inicial');

    setSaving(true);
    try {
      const LIMIT_MAP: Record<string, { maxUses: number | null; periodLimit: object }> = {
        once:      { maxUses: 1,    periodLimit: {} },
        daily:     { maxUses: null, periodLimit: { count: 1, period: 'day'   } },
        weekly:    { maxUses: null, periodLimit: { count: 1, period: 'week'  } },
        monthly:   { maxUses: null, periodLimit: { count: 1, period: 'month' } },
        unlimited: { maxUses: null, periodLimit: {} },
      };
      const limitVals = LIMIT_MAP[useLimit] ?? LIMIT_MAP.once;

      const result = await createCoupon({
        customerId:  customer._id,
        branch,
        type:        discountType,
        value:       needsValue ? parseFloat(discountValue) : undefined,
        description: description || undefined,
        applyTo,
        validFrom,
        validUntil,
        validDays,
        validHours:  useHours ? { from: hoursFrom, to: hoursTo } : {},
        ...limitVals,
      });
      onCreated(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar el cupón');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full sm:max-w-2xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl"
        style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-bold text-lg">Nuevo Cupón</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        {/* Body con scroll */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── Sucursal (solo superadmin) ── */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Sucursal</p>
              <select value={branch} onChange={e => { setBranch(e.target.value); setCustomer(null); setCustSearch(''); }}
                className={inp} style={inpStyle}>
                <option value="">Selecciona una sucursal</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {/* ── Cliente ── */}
          <div className={isSuperAdmin ? section : 'space-y-3'} style={isSuperAdmin ? sectionStyle : {}}>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Cliente</p>

            {customer ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <div className="flex items-center gap-2.5">
                  <User size={15} className="text-green-400" />
                  <div>
                    <p className="text-white text-sm font-semibold">{customer.name}</p>
                    <p className="text-gray-400 text-xs">{customer.phone}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setCustomer(null); setCustSearch(''); setInlineCreate(false); }}
                  className="text-gray-500 hover:text-white"><X size={15} /></button>
              </div>

            ) : inlineCreate ? (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2">
                  <UserPlus size={14} className="text-green-400" />
                  <p className="text-green-400 text-sm font-semibold">Registrar nuevo cliente</p>
                  <button type="button" onClick={() => setInlineCreate(false)} className="ml-auto text-gray-600 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nombre completo *</label>
                    <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)}
                      placeholder="Ej. Juan Pérez" className={inp} style={inpStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Teléfono *</label>
                    <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                      placeholder="10 dígitos" className={inp} style={inpStyle} />
                  </div>
                </div>
                {custCreateErr && <p className="text-red-400 text-xs">{custCreateErr}</p>}
                <button type="button" onClick={handleCreateCustomer} disabled={savingCust}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: '#16a34a' }}>
                  {savingCust ? 'Guardando...' : 'Crear y seleccionar'}
                </button>
              </div>

            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  autoFocus={!isSuperAdmin}
                  type="text"
                  value={custSearch}
                  onChange={e => { setCustSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={isSuperAdmin && !branch ? 'Selecciona una sucursal primero' : 'Buscar por nombre o teléfono...'}
                  disabled={isSuperAdmin && !branch}
                  className={`${inp} pl-9`}
                  style={{ ...inpStyle, opacity: isSuperAdmin && !branch ? 0.5 : 1 }}
                />
                {showDropdown && custSearch.length >= 1 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl overflow-hidden shadow-lg"
                    style={{ background: '#1e1e30', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {custLoading ? (
                      <p className="px-4 py-3 text-gray-500 text-sm">Buscando...</p>
                    ) : custResults.length === 0 ? (
                      <div className="p-3 space-y-2">
                        <p className="text-gray-500 text-sm px-1">
                          No encontrado: <span className="text-gray-200">"{custSearch}"</span>
                        </p>
                        <button type="button" onClick={openInlineCreate}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-green-400 transition-all"
                          style={{ border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.05)' }}>
                          <UserPlus size={14} />
                          Registrar como nuevo cliente
                        </button>
                      </div>
                    ) : custResults.map(c => (
                      <button key={c._id} type="button"
                        className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                        onClick={() => { setCustomer(c); setCustSearch(''); setShowDropdown(false); }}>
                        <p className="text-white text-sm font-medium">{c.name}</p>
                        <p className="text-gray-500 text-xs">{c.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Tipo de descuento ── */}
          <div className={section} style={sectionStyle}>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tipo de descuento</p>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setDiscountType(t.value)}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background:  discountType === t.value ? 'rgba(248,67,49,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${discountType === t.value ? '#F84331' : 'rgba(255,255,255,0.08)'}`,
                    color:       discountType === t.value ? '#F84331' : '#9ca3af',
                  }}>
                  <span className="text-xl">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {needsValue && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {discountType === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'}
                  </label>
                  <input type="number" min="0" max={discountType === 'percentage' ? 100 : undefined}
                    value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'Ej. 15' : 'Ej. 50'}
                    className={inp} style={inpStyle} />
                </div>
              )}
              <div className={needsValue ? '' : 'col-span-2'}>
                <label className="block text-xs text-gray-400 mb-1.5">Descripción (opcional)</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ej. en pizza grande" className={inp} style={inpStyle} />
              </div>
            </div>
          </div>

          {/* ── Dónde aplica ── */}
          <div className={section} style={sectionStyle}>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">¿Dónde aplica?</p>
            <div className="flex gap-2 flex-wrap">
              {APPLY.map(a => (
                <button key={a.value} type="button" onClick={() => toggleApply(a.value)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: applyTo.includes(a.value) ? 'rgba(248,67,49,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${applyTo.includes(a.value) ? '#F84331' : 'rgba(255,255,255,0.08)'}`,
                    color: applyTo.includes(a.value) ? '#F84331' : '#9ca3af',
                  }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Vigencia ── */}
          <div className={section} style={sectionStyle}>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Vigencia</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Desde</label>
                <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)}
                  className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Hasta</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                  className={inp} style={inpStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Días válidos <span className="text-gray-600 font-normal">(vacío = todos)</span>
              </label>
              <div className="flex gap-1.5">
                {DAYS.map(d => (
                  <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: validDays.includes(d.value) ? '#F84331' : 'rgba(255,255,255,0.06)',
                      color:      validDays.includes(d.value) ? '#fff'    : '#9ca3af',
                    }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={useHours} onChange={e => setUseHours(e.target.checked)}
                  className="accent-red-500 w-4 h-4" />
                <span className="text-xs text-gray-400">Restringir por horario</span>
              </label>
              {useHours && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Desde</label>
                    <input type="time" value={hoursFrom} onChange={e => setHoursFrom(e.target.value)}
                      className={inp} style={inpStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Hasta</label>
                    <input type="time" value={hoursTo} onChange={e => setHoursTo(e.target.value)}
                      className={inp} style={inpStyle} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Límite de uso ── */}
          <div className={section} style={sectionStyle}>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">¿Con qué frecuencia puede usarse?</p>
            <div className="space-y-2">
              {(() => {
                const days = validFrom && validUntil
                  ? Math.round((new Date(validUntil).getTime() - new Date(validFrom).getTime()) / 86400000)
                  : 0;
                const warn =
                  useLimit === 'monthly' && days <= 30
                    ? `⚠️ La vigencia es de ${days} día(s), menor a 1 mes. En la práctica solo se podrá usar 1 vez en total.`
                    : useLimit === 'weekly' && days <= 7
                    ? `⚠️ La vigencia es de ${days} día(s), menor a 1 semana. En la práctica solo se podrá usar 1 vez en total.`
                    : useLimit === 'daily' && days <= 1
                    ? `⚠️ La vigencia es de ${days} día(s). Solo se podrá usar 1 vez en total.`
                    : null;
                return warn ? (
                  <p className="text-xs px-3 py-2.5 rounded-xl leading-snug"
                    style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', color: '#fbbf24' }}>
                    {warn}
                  </p>
                ) : null;
              })()}
              {[
                { id: 'once',      label: '1 sola vez',       desc: 'El cliente lo canjea una vez y el cupón queda agotado para siempre.'          },
                { id: 'daily',     label: '1 vez por día',    desc: 'Puede usarlo una vez al día — al día siguiente se habilita de nuevo.'          },
                { id: 'weekly',    label: '1 vez por semana', desc: 'Se puede canjear una vez por semana durante toda la vigencia.'                  },
                { id: 'monthly',   label: '1 vez por mes',    desc: 'Un uso por mes; se reinicia al comenzar el siguiente mes.'                     },
                { id: 'unlimited', label: 'Ilimitado',        desc: 'Sin restricción de usos — válido cuantas veces quiera dentro de la vigencia.'  },
              ].map(opt => {
                const selected = useLimit === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setUseLimit(opt.id)}
                    className="w-full text-left px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: selected ? 'rgba(248,67,49,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selected ? '#F84331' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        style={{ borderColor: selected ? '#F84331' : '#6b7280' }}>
                        {selected && <span className="w-1.5 h-1.5 rounded-full bg-red-500 block" />}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: selected ? '#F84331' : '#d1d5db' }}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs leading-snug pl-5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm pb-1">{error}</p>}
        </form>

        {/* Footer sticky */}
        <div className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl text-gray-400 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: '#F84331' }}>
            {saving ? 'Generando...' : '🎟️ Generar cupón'}
          </button>
        </div>
      </div>
    </div>
  );
}
