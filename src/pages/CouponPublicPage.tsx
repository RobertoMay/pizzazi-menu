import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { getCouponPublic } from '../services/api';

const LOGO = '/images/logo.png';

const APPLY_LABEL: Record<string, string> = {
  dine_in: '🍽️ Comedor', delivery: '🛵 Domicilio', pickup: '🥡 Para llevar',
};

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
  active:    { label: 'VÁLIDO',    bg: '#16a34a', color: '#fff' },
  used:      { label: 'UTILIZADO', bg: '#374151', color: '#9ca3af' },
  expired:   { label: 'VENCIDO',   bg: '#7f1d1d', color: '#fca5a5' },
  cancelled: { label: 'CANCELADO', bg: '#7f1d1d', color: '#fca5a5' },
} as const;

interface CouponData {
  _id: string; code: string;
  customer: { name: string };
  branch: { name: string };
  type: string; value?: number; description?: string;
  applyTo: string[];
  validFrom: string; validUntil: string;
  maxUses: number | null; usedCount: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
}

export default function CouponPublicPage() {
  const { code }     = useParams<{ code: string }>();
  const couponUrl    = window.location.href;

  const [coupon,   setCoupon]   = useState<CouponData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!code) return;
    getCouponPublic(code)
      .then(setCoupon)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  // Evita que la pantalla se apague mientras se muestra el QR
  useEffect(() => {
    if (!coupon || coupon.status !== 'active') return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request('screen').then(l => { lock = l; }).catch(() => {});
    return () => { lock?.release(); };
  }, [coupon]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#060612' }}>
      <p className="text-gray-400 animate-pulse">Cargando cupón...</p>
    </div>
  );

  if (notFound || !coupon) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#060612' }}>
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-white text-xl font-bold mb-2">Cupón no encontrado</h1>
        <p className="text-gray-500 text-sm">El código QR no corresponde a ningún cupón válido.</p>
      </div>
    </div>
  );

  const st           = STATUS_CONFIG[coupon.status];
  const discountText = DISCOUNT_TEXT(coupon.type, coupon.value, coupon.description);
  const validUntilStr = new Date(coupon.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const isActive     = coupon.status === 'active';

  // Pantalla completa — solo el QR en blanco brillante
  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-6 cursor-pointer"
        style={{ background: '#ffffff' }}
        onClick={() => setFullscreen(false)}
      >
        <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase">Toca para salir</p>
        <QRCodeCanvas
          value={couponUrl}
          size={Math.min(window.innerWidth * 0.82, 320)}
          level="H"
          imageSettings={{ src: `${window.location.origin}${LOGO}`, height: 48, width: 48, excavate: true }}
          style={{ display: 'block', borderRadius: 12 }}
        />
        <div className="text-center px-6">
          <p className="text-gray-800 font-black text-xl leading-tight">{discountText}</p>
          <p className="text-gray-500 text-sm mt-1">Para: <strong>{coupon.customer?.name}</strong></p>
        </div>
        <p className="text-gray-400 text-xs text-center px-8">
          Muestra este código al cajero para canjear tu descuento
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8" style={{ background: '#060612' }}>
      <div className="w-full max-w-sm space-y-4">

        {/* Branding */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <img src={LOGO} alt="Pizzazi" className="w-9 h-9 object-contain" />
          <span className="text-white font-black tracking-widest text-lg">PIZZAZI</span>
        </div>

        {/* Status */}
        <div className="rounded-2xl px-5 py-3 text-center" style={{ background: st.bg }}>
          <p className="font-black text-xl tracking-widest" style={{ color: st.color }}>{st.label}</p>
        </div>

        {/* Coupon info */}
        <div className="rounded-2xl px-5 py-5 space-y-3"
          style={{ background: 'linear-gradient(160deg,#1c1c2e,#0e0e18)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center">
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Cupón de descuento</p>
            <p className="text-white font-black text-2xl leading-tight">{discountText}</p>
            <p className="text-gray-400 text-sm mt-1.5">
              Para: <span className="text-gray-200 font-semibold">{coupon.customer?.name}</span>
            </p>
            <p className="text-gray-600 text-xs mt-0.5">{coupon.branch?.name}</p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            {coupon.applyTo?.length > 0 && (
              <p className="text-center">{coupon.applyTo.map(a => APPLY_LABEL[a]).join(' · ')}</p>
            )}
            <p className="text-center">Válido hasta: <span className="text-gray-400">{validUntilStr}</span></p>
            <p className="text-center">Usos: <span className="text-gray-400">{coupon.usedCount}/{coupon.maxUses === null ? '∞' : coupon.maxUses}</span></p>
          </div>

          {/* QR */}
          {isActive ? (
            <div
              className="flex flex-col items-center gap-2 pt-1 cursor-pointer"
              onClick={() => setFullscreen(true)}
            >
              <div className="p-4 rounded-2xl shadow-lg" style={{ background: '#fff' }}>
                <QRCodeCanvas
                  value={couponUrl}
                  size={200}
                  level="H"
                  imageSettings={{ src: `${window.location.origin}${LOGO}`, height: 40, width: 40, excavate: true }}
                  style={{ display: 'block', borderRadius: 8 }}
                />
              </div>
              <p className="text-gray-500 text-xs font-mono">{coupon.code}</p>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(248,67,49,0.1)', border: '1px solid rgba(248,67,49,0.2)' }}>
                <span className="text-sm">⛶</span>
                <span className="text-red-400 text-xs font-semibold">Toca para agrandar</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-1 opacity-40">
              <div className="p-4 rounded-2xl" style={{ background: '#fff' }}>
                <QRCodeCanvas
                  value={couponUrl}
                  size={200}
                  level="H"
                  style={{ display: 'block', borderRadius: 8, filter: 'grayscale(1)' }}
                />
              </div>
              <p className="text-gray-600 text-xs font-mono">{coupon.code}</p>
            </div>
          )}
        </div>

        {/* Instrucción */}
        {isActive && (
          <div className="rounded-2xl px-5 py-4 text-center"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
            <p className="text-green-400 text-sm font-semibold">Muestra este QR al cajero</p>
            <p className="text-gray-500 text-xs mt-1">El staff de Pizzazi lo escaneará para aplicar tu descuento</p>
          </div>
        )}

      </div>
    </div>
  );
}
