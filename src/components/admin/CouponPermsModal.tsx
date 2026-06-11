import { useState } from 'react';
import { X, Shield } from 'react-feather';
import { toast } from 'sonner';
import { updateCouponPerms } from '../../services/api';

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
  _id: string;
  name: string;
  role: string;
  couponPerms?: CouponPerms;
}

interface Props {
  user: User;
  onClose: () => void;
  onSaved: (perms: CouponPerms) => void;
}

const TYPES = [
  { key: 'percentage',   label: '% Descuento' },
  { key: 'fixed_amount', label: '$ Monto fijo' },
  { key: '2x1',          label: '2×1' },
  { key: 'free_item',    label: 'Producto gratis' },
];

export default function CouponPermsModal({ user, onClose, onSaved }: Props) {
  const p = user.couponPerms ?? {};

  const [enabled,          setEnabled]          = useState(p.enabled ?? false);
  const [allowedTypes,     setAllowedTypes]      = useState<string[]>(p.allowedTypes ?? []);
  const [maxDiscountPct,   setMaxDiscountPct]    = useState<string>(p.maxDiscountPct != null ? String(p.maxDiscountPct) : '100');
  const [maxFixedAmount,   setMaxFixedAmount]    = useState<string>(p.maxFixedAmount != null ? String(p.maxFixedAmount) : '');
  const [workingHoursOnly, setWorkingHoursOnly]  = useState(p.workingHoursOnly ?? false);
  const [hoursFrom,        setHoursFrom]         = useState(p.workingHours?.from ?? '08:00');
  const [hoursTo,          setHoursTo]           = useState(p.workingHours?.to   ?? '22:00');
  const [maxPerDay,        setMaxPerDay]          = useState<string>(p.maxCouponsPerDay != null ? String(p.maxCouponsPerDay) : '');
  const [saving,           setSaving]            = useState(false);

  const toggleType = (key: string) =>
    setAllowedTypes(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: CouponPerms = {
        enabled,
        allowedTypes,
        maxDiscountPct:   maxDiscountPct   ? Number(maxDiscountPct)   : 100,
        maxFixedAmount:   maxFixedAmount   ? Number(maxFixedAmount)   : null,
        workingHoursOnly,
        workingHours:     workingHoursOnly ? { from: hoursFrom, to: hoursTo } : {},
        maxCouponsPerDay: maxPerDay        ? Number(maxPerDay)        : null,
      };
      const res = await updateCouponPerms(user._id, data);
      onSaved(res.couponPerms);
      toast.success('Permisos actualizados');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-blue-400" />
            <h2 className="text-white font-bold text-sm">Permisos de cupones</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">{user.name}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">Puede generar cupones</p>
              <p className="text-gray-500 text-xs mt-0.5">Activar para permitir a este usuario crear cupones</p>
            </div>
            <button
              onClick={() => setEnabled(e => !e)}
              className="w-11 h-6 rounded-full transition-colors flex-shrink-0 relative"
              style={{ background: enabled ? '#4ade80' : 'rgba(255,255,255,0.12)' }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: enabled ? '22px' : '2px' }} />
            </button>
          </div>

          {enabled && (
            <>
              {/* Tipos permitidos */}
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Tipos permitidos <span className="text-gray-600 normal-case">(vacío = todos)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(t => {
                    const active = allowedTypes.includes(t.key);
                    return (
                      <button key={t.key} onClick={() => toggleType(t.key)}
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

              {/* Descuento máximo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-semibold block mb-1.5">Máx. % descuento</label>
                  <input type="number" min="1" max="100"
                    value={maxDiscountPct}
                    onChange={e => setMaxDiscountPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    placeholder="100" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-semibold block mb-1.5">Máx. monto fijo $</label>
                  <input type="number" min="0"
                    value={maxFixedAmount}
                    onChange={e => setMaxFixedAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    placeholder="Sin límite" />
                </div>
              </div>

              {/* Límite diario */}
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1.5">
                  Límite de cupones por día <span className="text-gray-600 font-normal">(vacío = sin límite)</span>
                </label>
                <input type="number" min="1"
                  value={maxPerDay}
                  onChange={e => setMaxPerDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  placeholder="Sin límite" />
              </div>

              {/* Horario de trabajo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Solo en horario</p>
                  <button
                    onClick={() => setWorkingHoursOnly(v => !v)}
                    className="w-9 h-5 rounded-full transition-colors relative flex-shrink-0"
                    style={{ background: workingHoursOnly ? '#4ade80' : 'rgba(255,255,255,0.12)' }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                      style={{ left: workingHoursOnly ? '17px' : '2px' }} />
                  </button>
                </div>
                {workingHoursOnly && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Desde</label>
                      <input type="time" value={hoursFrom} onChange={e => setHoursFrom(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Hasta</label>
                      <input type="time" value={hoursTo} onChange={e => setHoursTo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 flex gap-2 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-gray-400 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60"
            style={{ background: '#F84331' }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
