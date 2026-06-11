import { useState } from 'react';
import { X, Share2, Printer } from 'react-feather';
import { FaWhatsapp } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import { openWhatsApp, shareImage, buildWaMessage } from '../../utils/couponShare';
import { printCoupon } from '../../utils/printCoupon';

const LOGO = '/images/logo.png';
const QR_ID = 'result-qr';

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

interface Coupon {
  _id: string; code: string;
  customer: { name: string; phone: string };
  branch?: { name: string };
  type: string; value?: number; description?: string;
  applyTo: string[];
  validFrom: string; validUntil: string;
  maxUses: number | null; usedCount: number;
}

interface Props {
  coupon: Coupon;
  couponUrl: string;
  onClose: () => void;
}

export default function CouponResultModal({ coupon, couponUrl, onClose }: Props) {
  const [sharing, setSharing] = useState(false);

  const discountText  = DISCOUNT_TEXT(coupon.type, coupon.value, coupon.description);
  const validUntilStr = new Date(coupon.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const waMsg         = buildWaMessage(coupon.customer?.name, discountText, validUntilStr, couponUrl);

  const handleWhatsApp = () => {
    openWhatsApp(coupon.customer?.phone ?? '', waMsg);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareImage(QR_ID, coupon.code, coupon.customer?.name, discountText, validUntilStr, couponUrl);
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    printCoupon({
      qrCanvasId: QR_ID, code: coupon.code, discountText,
      customerName: coupon.customer?.name, validUntilStr, couponUrl,
      applyTo: coupon.applyTo, maxUses: coupon.maxUses, branchName: coupon.branch?.name,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-bold">Cupón generado</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">
          <div className="rounded-2xl p-5 flex flex-col items-center gap-3" style={{ background: '#ffffff' }}>
            <div className="flex items-center gap-2">
              <img src={LOGO} alt="Pizzazi" className="w-7 h-7 object-contain" />
              <span className="font-black tracking-widest text-gray-900 text-sm">PIZZAZI</span>
            </div>
            <p className="text-red-500 text-xs font-bold tracking-wider uppercase">Cupón de descuento</p>
            <p className="text-gray-900 font-black text-xl text-center leading-tight">{discountText}</p>
            <p className="text-gray-600 text-xs">Para: <strong>{coupon.customer?.name}</strong></p>
            <div className="p-2.5 rounded-xl" style={{ background: '#f3f4f6' }}>
              <QRCodeCanvas id={QR_ID} value={couponUrl} size={180} level="H"
                imageSettings={{ src: `${window.location.origin}${LOGO}`, height: 36, width: 36, excavate: true }}
                style={{ display: 'block', borderRadius: 6 }} />
            </div>
            <p className="text-gray-500 text-xs">Válido hasta: {validUntilStr}</p>
            <p className="text-gray-400 text-xs font-mono break-all text-center px-1">{couponUrl}</p>
            <p className="text-gray-400 text-xs font-mono">Código: {coupon.code}</p>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 space-y-2 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
            <FaWhatsapp size={16} /> Enviar por WhatsApp
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleShare} disabled={sharing}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Share2 size={15} /> {sharing ? 'Generando...' : 'Compartir imagen'}
            </button>
            <button onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Printer size={15} /> Imprimir
            </button>
          </div>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: '#F84331' }}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
