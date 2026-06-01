import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { getCouponPublic, redeemCouponPublic } from '../services/api';

const LOGO = '/images/logo.png';

const APPLY_LABEL: Record<string, string> = {
  dine_in: '🍽️ Comedor', delivery: '🛵 Domicilio', pickup: '🥡 Para llevar',
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DISCOUNT_TEXT = (type: string, value?: number, description?: string) => {
  const desc = description ? ` — ${description}` : '';
  switch (type) {
    case 'percentage':   return `${value}% de descuento${desc}`;
    case 'fixed_amount': return `$${value} de descuento${desc}`;
    case '2x1':          return `2×1${desc}`;
    case 'free_item':    return description || 'Producto gratis';
    default:             return description || 'Descuento especial';
  }
};

const STATUS_CONFIG = {
  active:    { label: 'VÁLIDO',    bg: '#16a34a', color: '#fff', emoji: '✅' },
  used:      { label: 'UTILIZADO', bg: '#374151', color: '#9ca3af', emoji: '✗' },
  expired:   { label: 'VENCIDO',   bg: '#7f1d1d', color: '#fca5a5', emoji: '⏰' },
  cancelled: { label: 'CANCELADO', bg: '#7f1d1d', color: '#fca5a5', emoji: '✗' },
} as const;

interface CouponData {
  _id: string;
  code: string;
  customer: { name: string };
  branch: { name: string };
  type: string;
  value?: number;
  description?: string;
  applyTo: string[];
  validFrom: string;
  validUntil: string;
  validDays: number[];
  validHours?: { from?: string; to?: string };
  maxUses: number | null;
  usedCount: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  periodLimit?: { count?: number; period?: string };
}

const PERIOD_LABEL: Record<string, string> = { day: 'día', week: 'semana', month: 'mes' };

export default function CouponPublicPage() {
  const { code } = useParams<{ code: string }>();
  const couponUrl = window.location.href;

  const [coupon,    setCoupon]    = useState<CouponData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed,  setRedeemed]  = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [confirm,   setConfirm]   = useState(false);

  useEffect(() => {
    if (!code) return;
    getCouponPublic(code)
      .then(setCoupon)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  const handleRedeem = async () => {
    if (!code) return;
    setRedeeming(true);
    setRedeemError('');
    try {
      const res = await redeemCouponPublic(code);
      if (res.message?.includes('exitosamente')) {
        setRedeemed(true);
        setCoupon(prev => prev ? { ...prev, status: prev.maxUses !== null && prev.usedCount + 1 >= prev.maxUses ? 'used' : 'active', usedCount: prev.usedCount + 1 } : prev);
      } else {
        setRedeemError(res.message || 'Error al canjear');
      }
    } catch {
      setRedeemError('Error de red. Intenta de nuevo.');
    } finally {
      setRedeeming(false);
      setConfirm(false);
    }
  };

  if (loading) return (
    <div className="menu-bg min-h-screen flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Cargando cupón...</p>
    </div>
  );

  if (notFound || !coupon) return (
    <div className="menu-bg min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-white text-xl font-bold mb-2">Cupón no encontrado</h1>
        <p className="text-gray-500 text-sm">El código QR no corresponde a ningún cupón válido.</p>
      </div>
    </div>
  );

  const st = STATUS_CONFIG[coupon.status];
  const discountText = DISCOUNT_TEXT(coupon.type, coupon.value, coupon.description);
  const validFromStr  = new Date(coupon.validFrom).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const validUntilStr = new Date(coupon.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const isActive = coupon.status === 'active';

  return (
    <div className="menu-bg min-h-screen flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">

        {/* Branding */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <img src={LOGO} alt="Pizzazi" className="w-9 h-9 object-contain" />
          <span className="text-white font-black tracking-widest text-lg">PIZZAZI</span>
        </div>

        {/* Status banner */}
        <div className="rounded-2xl px-5 py-4 text-center"
          style={{ background: st.bg }}>
          <p className="text-4xl mb-1">{st.emoji}</p>
          <p className="font-black text-2xl tracking-widest" style={{ color: st.color }}>{st.label}</p>
        </div>

        {/* Coupon card */}
        <div className="rounded-2xl px-5 py-5 space-y-4"
          style={{ background: 'linear-gradient(160deg,#1c1c2e,#0e0e18)', border: '1px solid rgba(255,255,255,0.08)' }}>

          <div className="text-center">
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Cupón de descuento</p>
            <p className="text-white font-black text-2xl leading-tight">{discountText}</p>
            <p className="text-gray-400 text-sm mt-1.5">
              Para: <span className="text-gray-200 font-semibold">{coupon.customer?.name}</span>
            </p>
            <p className="text-gray-600 text-xs mt-0.5">{coupon.branch?.name}</p>
          </div>

          <div className="space-y-2 text-sm">
            {coupon.applyTo?.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-xs w-20 flex-shrink-0 pt-0.5">Aplica en</span>
                <p className="text-gray-300 text-xs">{coupon.applyTo.map(a => APPLY_LABEL[a]).join(' · ')}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">Vigencia</span>
              <p className="text-gray-300 text-xs">{validFromStr} – {validUntilStr}</p>
            </div>
            {coupon.validDays?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs w-20 flex-shrink-0">Días</span>
                <p className="text-gray-300 text-xs">{coupon.validDays.map(d => DAY_NAMES[d]).join(', ')}</p>
              </div>
            )}
            {coupon.validHours?.from && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs w-20 flex-shrink-0">Horario</span>
                <p className="text-gray-300 text-xs">{coupon.validHours.from} – {coupon.validHours.to}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">Usos</span>
              <p className="text-gray-300 text-xs">
                {coupon.usedCount}/{coupon.maxUses === null ? '∞' : coupon.maxUses}
                {coupon.periodLimit?.period && ` · 1 por ${PERIOD_LABEL[coupon.periodLimit.period]}`}
              </p>
            </div>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="p-3 rounded-xl" style={{ background: '#fff' }}>
              <QRCodeCanvas
                value={couponUrl}
                size={160}
                level="H"
                imageSettings={{ src: `${window.location.origin}${LOGO}`, height: 32, width: 32, excavate: true }}
                style={{ display: 'block', borderRadius: 6 }}
              />
            </div>
            <p className="text-gray-600 text-xs font-mono">{coupon.code}</p>
          </div>
        </div>

        {/* Redeem */}
        {isActive && !redeemed && (
          !confirm ? (
            <button onClick={() => setConfirm(true)}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              ✅ Canjear cupón
            </button>
          ) : (
            <div className="rounded-2xl p-5 text-center space-y-4"
              style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)' }}>
              <p className="text-white font-semibold">¿Confirmar canje?</p>
              <p className="text-gray-400 text-sm">Esta acción marcará el cupón como usado y no se podrá deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-gray-400 text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  Cancelar
                </button>
                <button onClick={handleRedeem} disabled={redeeming}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: '#16a34a' }}>
                  {redeeming ? 'Canjeando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )
        )}

        {redeemed && (
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)' }}>
            <p className="text-green-400 text-4xl mb-2">🎉</p>
            <p className="text-white font-bold text-lg">¡Cupón canjeado!</p>
            <p className="text-gray-400 text-sm mt-1">El descuento ha sido aplicado exitosamente.</p>
          </div>
        )}

        {redeemError && (
          <div className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(248,67,49,0.1)', border: '1px solid rgba(248,67,49,0.2)' }}>
            <p className="text-red-400 text-sm text-center">{redeemError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
