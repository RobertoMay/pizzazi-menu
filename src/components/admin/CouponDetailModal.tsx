import { useState } from 'react';
import { X, Download, Printer, XCircle } from 'react-feather';
import { FaWhatsapp } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { cancelCoupon } from '../../services/api';
import ConfirmModal from './ConfirmModal';
import { shareWhatsApp, buildWaMessage } from '../../utils/couponShare';

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

  const handleWhatsApp = async () => {
    setSharing(true);
    try {
      await shareWhatsApp(QR_ID, coupon.code, coupon.customer?.name, discountText, validUntilStr, couponUrl, coupon.customer?.phone ?? '', waMsg);
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    const qrEl = document.getElementById('detail-qr') as HTMLCanvasElement;
    if (!qrEl) return;
    const link = document.createElement('a');
    link.download = `cupon-${coupon.code}.png`;
    link.href = qrEl.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    const qrEl     = document.getElementById('detail-qr') as HTMLCanvasElement;
    const qrData   = qrEl?.toDataURL('image/png') ?? '';
    const applyStr = coupon.applyTo?.length
      ? coupon.applyTo.map(a => APPLY_LABEL[a]).join(', ')
      : 'Todos los pedidos';

    const pw = window.open('', '_blank', 'width=600,height=800');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Cupón ${coupon.code}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{width:80mm;font-family:'Courier New',monospace;font-size:11px;padding:4mm;text-align:center}
        h1{font-size:20px;letter-spacing:4px;margin-bottom:2px}
        .sub{font-size:9px;margin-bottom:6px;color:#555}
        hr{border:none;border-top:1px dashed #000;margin:5px 0}
        .tag{font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#555;margin-bottom:2px}
        .big{font-size:18px;font-weight:bold;margin:3px 0}
        .info{font-size:10px;margin:2px 0}
        .qr{width:140px;height:140px;margin:6px auto;display:block}
        .url{font-size:7px;color:#444;word-break:break-all;margin-top:2px}
        .code{font-size:9px;margin-top:4px;letter-spacing:2px}
        @media print{@page{size:80mm auto;margin:0}body{width:80mm}}
      </style></head><body>
      <h1>PIZZAZI</h1>
      ${coupon.branch?.name ? `<p class="sub">${coupon.branch.name}</p>` : ''}
      <hr>
      <p class="tag">Cupón de descuento</p>
      <p class="big">${discountText}</p>
      ${coupon.description ? `<p class="info">${coupon.description}</p>` : ''}
      <hr>
      <p class="info">Para: <strong>${coupon.customer?.name}</strong></p>
      <p class="info">Válido hasta: ${validUntilStr}</p>
      <p class="info">Aplica: ${applyStr}</p>
      <p class="info">Usos: ${coupon.maxUses === null ? 'Ilimitado' : coupon.maxUses}</p>
      <hr>
      <img src="${qrData}" class="qr" />
      <p class="url">${couponUrl}</p>
      <p class="code">Cód: ${coupon.code}</p>
      <hr>
      <p style="font-size:8px;margin-top:2px">Escanea el QR para validar</p>
      <script>window.onload=function(){window.print();setTimeout(()=>window.close(),500)}<\/script>
    </body></html>`);
    pw.document.close();
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
        <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]"
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

          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

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

          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-3 space-y-2 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <Download size={15} />
                Descargar QR
              </button>
              <button onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <Printer size={15} />
                Imprimir
              </button>
            </div>

            <button onClick={handleWhatsApp} disabled={sharing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
              <FaWhatsapp size={16} />
              {sharing ? 'Generando imagen...' : 'Enviar por WhatsApp'}
            </button>

            {coupon.status === 'active' && (
              <button onClick={() => setShowConfirmCancel(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
                style={{ background: 'rgba(248,67,49,0.1)', border: '1px solid rgba(248,67,49,0.25)', color: '#f87171' }}>
                <XCircle size={15} />
                Cancelar cupón
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
