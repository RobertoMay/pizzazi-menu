import { useState } from 'react';
import { X, Share2, Printer, XCircle } from 'react-feather';
import { FaWhatsapp } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { cancelCoupon } from '../../services/api';
import ConfirmModal from './ConfirmModal';
import { buildWaLink, shareImage, buildWaMessage } from '../../utils/couponShare';
import { printCoupon } from '../../utils/printCoupon';

const LOGO  = '/images/logo.png';
const QR_ID = 'detail-qr';

const APPLY_LABEL: Record<string, string> = {
  dine_in: 'Comedor', delivery: 'Domicilio', pickup: 'Para llevar',
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Activo',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  used:      { label: 'Usado',     color: '#9ca3af', bg: 'rgba(156,163,175,0.1)'  },
  expired:   { label: 'Vencido',   color: '#f87171', bg: 'rgba(248,113,113,0.1)'  },
  cancelled: { label: 'Cancelado', color: '#f87171', bg: 'rgba(248,113,113,0.1)'  },
};

const DISCOUNT_TEXT = (type: string, value?: number, description?: string) => {
  const desc = description ? ` — ${description}` : '';
  switch (type) {
    case 'percentage':   return `${value}% de descuento${desc}`;
    case 'fixed_amount': return `$${value}${desc}`;
    case '2x1':          return `2×1${desc}`;
    case 'free_item':    return description ? `${description} gratis` : 'Producto gratis';
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
  status: 'active' | 'used' | 'expired' | 'cancelled';
  whatsappSent: boolean;
  createdAt: string;
  createdBy?: { name: string };
}

interface Props {
  coupon: Coupon;
  onClose: () => void;
  onCancelled: (id: string) => void;
}

export default function CouponDetailModal({ coupon: initial, onClose, onCancelled }: Props) {
  const [coupon,            setCoupon]            = useState(initial);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [sharing,           setSharing]           = useState(false);

  const couponUrl     = `${window.location.origin}/c/${coupon.code}`;
  const discountText  = DISCOUNT_TEXT(coupon.type, coupon.value, coupon.description);
  const validUntilStr = new Date(coupon.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const st            = STATUS_STYLE[coupon.status] ?? STATUS_STYLE.cancelled;

  const waMsg = buildWaMessage(coupon.customer?.name, discountText, validUntilStr, couponUrl);

  const waLink = buildWaLink(coupon.customer?.phone ?? '', waMsg);

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

  const handleCancel = async () => {
    try {
      await cancelCoupon(coupon._id);
      setCoupon(c => ({ ...c, status: 'cancelled' }));
      onCancelled(coupon._id);
      setShowConfirmCancel(false);
      toast.success('Cupón cancelado');
    } catch {
      toast.error('Error al cancelar el cupón');
      setShowConfirmCancel(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)' }}>
        <div className="w-full max-w-sm sm:max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]"
          style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-white font-bold truncate">Detalle del cupón</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                style={{ background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-2">
              <X size={18} />
            </button>
          </div>

          {/* Body — single column on mobile, two columns on desktop */}
          <div className="overflow-y-auto flex-1 p-5">
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-[auto_1fr] sm:gap-4">

              {/* QR Card */}
              <div className="rounded-2xl p-5 flex flex-col items-center gap-3" style={{ background: '#ffffff' }}>
                <div className="flex items-center gap-2">
                  <img src={LOGO} alt="Pizzazi" className="w-7 h-7 object-contain" />
                  <span className="font-black tracking-widest text-gray-900 text-sm">PIZZAZI</span>
                </div>
                <p className="text-red-500 text-xs font-bold tracking-wider uppercase">Cupón de descuento</p>
                <p className="text-gray-900 font-black text-xl text-center leading-tight">{discountText}</p>
                <p className="text-gray-600 text-xs">Para: <strong>{coupon.customer?.name}</strong></p>

                <div className="p-2.5 rounded-xl" style={{ background: '#f3f4f6' }}>
                  <QRCodeCanvas
                    id="detail-qr"
                    value={couponUrl}
                    size={180}
                    level="H"
                    imageSettings={{
                      src: `${window.location.origin}${LOGO}`,
                      height: 36, width: 36, excavate: true,
                    }}
                    style={{ display: 'block', borderRadius: 6 }}
                  />
                </div>

                <p className="text-gray-500 text-xs">Válido hasta: {validUntilStr}</p>
                <p className="text-gray-400 text-xs font-mono break-all text-center px-1">{couponUrl}</p>
                <p className="text-gray-400 text-xs font-mono">Código: {coupon.code}</p>
              </div>

              {/* Right column: info + desktop actions */}
              <div className="flex flex-col gap-3">
                {/* Info */}
                <div className="rounded-xl px-4 py-3 space-y-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Row label="Cliente"    value={coupon.customer?.name} bold />
                  <Row label="Teléfono"  value={coupon.customer?.phone} />
                  <Row label="Usos"      value={`${coupon.usedCount} / ${coupon.maxUses === null ? '∞' : coupon.maxUses}`} />
                  {coupon.createdBy?.name && (
                    <Row label="Generado por" value={coupon.createdBy.name} />
                  )}
                  <Row label="Fecha" value={new Date(coupon.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                  {coupon.applyTo?.length > 0 && (
                    <Row label="Aplica" value={coupon.applyTo.map(a => APPLY_LABEL[a]).join(', ')} />
                  )}
                  {coupon.branch?.name && (
                    <Row label="Sucursal" value={coupon.branch.name} />
                  )}
                </div>

                {/* Actions — desktop only */}
                <div className="hidden sm:flex flex-col gap-2">
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
                    <FaWhatsapp size={16} /> Enviar por WhatsApp
                  </a>
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
                  {coupon.status === 'active' && (
                    <button onClick={() => setShowConfirmCancel(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(248,67,49,0.1)', border: '1px solid rgba(248,67,49,0.25)', color: '#f87171' }}>
                      <XCircle size={15} /> Cancelar cupón
                    </button>
                  )}
                  <button onClick={onClose}
                    className="w-full py-2.5 rounded-xl text-gray-400 text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    Cerrar
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Footer: actions — mobile only */}
          <div className="sm:hidden px-5 pb-5 pt-3 space-y-2 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
              <FaWhatsapp size={16} /> Enviar por WhatsApp
            </a>
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
            {coupon.status === 'active' && (
              <button onClick={() => setShowConfirmCancel(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(248,67,49,0.1)', border: '1px solid rgba(248,67,49,0.25)', color: '#f87171' }}>
                <XCircle size={15} /> Cancelar cupón
              </button>
            )}
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-gray-400 text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {showConfirmCancel && (
        <ConfirmModal
          message={`¿Cancelar el cupón de ${coupon.customer?.name}? Esta acción no se puede deshacer.`}
          onConfirm={handleCancel}
          onCancel={() => setShowConfirmCancel(false)}
        />
      )}
    </>
  );
}

function Row({ label, value, bold }: { label: string; value?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
      <span className={`text-xs text-right ${bold ? 'text-white font-semibold' : 'text-gray-300'}`}>{value}</span>
    </div>
  );
}
