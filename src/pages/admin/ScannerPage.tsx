import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { RotateCcw, CameraOff, CheckCircle, Search } from 'react-feather';
import AdminLayout from '../../components/admin/AdminLayout';
import { getCouponPublic, redeemCouponPublic } from '../../services/api';

interface CouponData {
  _id: string; code: string;
  customer: { name: string; phone: string };
  branch:   { name: string };
  type: string; value?: number; description?: string;
  applyTo: string[];
  validFrom: string; validUntil: string;
  validHours?: { from?: string; to?: string };
  maxUses: number | null; usedCount: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
}

const APPLY: Record<string, string> = {
  dine_in: 'Comedor', delivery: 'Domicilio', pickup: 'Para llevar',
};

const STATUS = {
  active:    { label: 'VÁLIDO',    color: '#4ade80', bg: 'rgba(22,163,74,0.15)',  border: 'rgba(22,163,74,0.4)' },
  used:      { label: 'UTILIZADO', color: '#9ca3af', bg: 'rgba(55,65,81,0.3)',    border: 'rgba(75,85,99,0.5)'  },
  expired:   { label: 'VENCIDO',   color: '#f87171', bg: 'rgba(127,29,29,0.2)',   border: 'rgba(248,113,113,0.3)' },
  cancelled: { label: 'CANCELADO', color: '#f87171', bg: 'rgba(127,29,29,0.2)',   border: 'rgba(248,113,113,0.3)' },
} as const;

const discountText = (type: string, value?: number, description?: string) => {
  const d = description ? ` — ${description}` : '';
  switch (type) {
    case 'percentage':   return `${value}% de descuento${d}`;
    case 'fixed_amount': return `$${value} de descuento${d}`;
    case '2x1':          return `2×1${d}`;
    case 'free_item':    return description || 'Producto gratis';
    default:             return description || 'Descuento especial';
  }
};

const extractCode = (text: string): string | null => {
  const m = text.match(/\/c\/([A-Fa-f0-9]{8})(?:[/?#]|$)/);
  return m ? m[1].toUpperCase() : null;
};

export default function ScannerPage() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const pausedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const [camError,    setCamError]    = useState('');
  const [scanning,    setScanning]    = useState(true);
  const [coupon,      setCoupon]      = useState<CouponData | null>(null);
  const [fetching,    setFetching]    = useState(false);
  const [redeeming,   setRedeeming]   = useState(false);
  const [redeemed,    setRedeemed]    = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [manualCode,  setManualCode]  = useState('');
  const [manualError, setManualError] = useState('');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const scanFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || pausedRef.current || video.readyState < video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0);
    const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });

    if (code?.data) {
      const couponCode = extractCode(code.data);
      if (couponCode) {
        pausedRef.current = true;
        setScanning(false);
        setFetching(true);
        getCouponPublic(couponCode)
          .then(setCoupon)
          .catch(() => setCoupon(null))
          .finally(() => setFetching(false));
        return;
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  }, []);

  const startCamera = useCallback(async () => {
    setCamError('');
    setCoupon(null);
    setRedeemed(false);
    setRedeemError('');
    pausedRef.current = false;
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      animRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCamError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  }, [scanFrame]);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  const handleReset = () => {
    setCoupon(null);
    setRedeemed(false);
    setRedeemError('');
    setManualCode('');
    setManualError('');
    pausedRef.current = false;
    setScanning(true);
    animRef.current = requestAnimationFrame(scanFrame);
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    const raw  = manualCode.trim().toUpperCase();
    const code = extractCode(raw) ?? (/^[A-F0-9]{8}$/.test(raw) ? raw : null);
    if (!code) { setManualError('Código inválido — debe tener 8 caracteres'); return; }
    pausedRef.current = true;
    setScanning(false);
    setFetching(true);
    try {
      const data = await getCouponPublic(code);
      setCoupon(data);
    } catch {
      setCoupon(null);
      setManualError('Cupón no encontrado');
      pausedRef.current = false;
      setScanning(true);
      animRef.current = requestAnimationFrame(scanFrame);
    } finally {
      setFetching(false);
    }
  };

  const handleRedeem = async () => {
    if (!coupon) return;
    setRedeeming(true);
    setRedeemError('');
    try {
      const res = await redeemCouponPublic(coupon.code);
      if (res.message?.includes('exitosamente')) {
        setRedeemed(true);
        setCoupon(prev => prev
          ? { ...prev, usedCount: prev.usedCount + 1, status: prev.maxUses !== null && prev.usedCount + 1 >= prev.maxUses ? 'used' : 'active' }
          : null);
      } else {
        setRedeemError(res.message || 'No se pudo canjear');
      }
    } catch {
      setRedeemError('Error de red. Intenta de nuevo.');
    } finally {
      setRedeeming(false);
    }
  };

  const st = coupon ? STATUS[coupon.status] : null;

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-white text-2xl font-bold">Escáner de Cupones</h1>

        {/* ── Viewfinder ── */}
        <div className="relative rounded-2xl overflow-hidden bg-black"
          style={{ aspectRatio: '4/3' }}>

          <video ref={videoRef} muted playsInline
            className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Cámara no disponible */}
          {camError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
              <CameraOff size={40} className="text-gray-500" />
              <p className="text-gray-300 text-sm">{camError}</p>
              <button onClick={startCamera}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: '#F84331' }}>
                Reintentar
              </button>
            </div>
          )}

          {/* Overlay de escaneo */}
          {scanning && !camError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Oscurecer bordes */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.5) 100%)',
              }} />
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.5) 100%)',
              }} />

              {/* Marco de escaneo */}
              <div className="relative" style={{ width: 220, height: 220 }}>
                {/* Esquinas */}
                {[
                  'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                  'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                  'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                  'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: '#F84331' }} />
                ))}
                {/* Línea animada */}
                <div className="absolute left-2 right-2 h-0.5 animate-bounce"
                  style={{ background: 'rgba(248,67,49,0.8)', top: '50%' }} />
              </div>

              <p className="relative mt-5 text-white text-sm font-medium px-4 py-2 rounded-full"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                Apunta al QR del cupón
              </p>
            </div>
          )}

          {/* Leyendo */}
          {fetching && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white text-sm font-medium">Leyendo cupón...</p>
            </div>
          )}
        </div>

        {/* ── Entrada manual ── */}
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualCode}
              onChange={e => { setManualCode(e.target.value); setManualError(''); }}
              placeholder="Código manual (ej. A1B2C3D4)"
              maxLength={80}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${manualError ? 'rgba(248,67,49,0.5)' : 'rgba(255,255,255,0.1)'}` }}
            />
            {manualError && (
              <p className="absolute -bottom-5 left-1 text-red-400 text-xs">{manualError}</p>
            )}
          </div>
          <button type="submit" disabled={!manualCode.trim() || fetching}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 flex-shrink-0"
            style={{ background: '#F84331' }}>
            <Search size={14} />
            Buscar
          </button>
        </form>

        {/* ── Resultado ── */}
        {coupon && st && (
          <div className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${st.border}`, background: st.bg }}>

            {/* Status banner */}
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ background: st.bg, borderBottom: `1px solid ${st.border}` }}>
              <span className="font-black text-xl tracking-wider" style={{ color: st.color }}>
                {coupon.status === 'active' ? '✅' : coupon.status === 'expired' ? '⏰' : '✗'}{' '}
                {st.label}
              </span>
              <span className="text-xs font-mono px-2 py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.2)', color: st.color }}>
                {coupon.code}
              </span>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Éxito de canje */}
              {redeemed && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-1"
                  style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)' }}>
                  <CheckCircle size={18} className="text-green-400" />
                  <p className="text-green-400 font-semibold text-sm">¡Cupón canjeado exitosamente!</p>
                </div>
              )}

              {/* Info cliente y descuento */}
              <div>
                <p className="text-white font-bold text-lg leading-tight">
                  {discountText(coupon.type, coupon.value, coupon.description)}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  Para: <span className="text-gray-200 font-semibold">{coupon.customer?.name}</span>
                  <span className="text-gray-600 ml-2">{coupon.customer?.phone}</span>
                </p>
              </div>

              {/* Detalles */}
              <div className="space-y-1 text-xs">
                {coupon.applyTo?.length > 0 && (
                  <p className="text-gray-400">
                    Aplica en: <span className="text-gray-300">{coupon.applyTo.map(a => APPLY[a]).join(', ')}</span>
                  </p>
                )}
                <p className="text-gray-400">
                  Válido hasta: <span className="text-gray-300">
                    {new Date(coupon.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </p>
                {coupon.validHours?.from && (
                  <p className="text-gray-400">
                    Horario: <span className="text-gray-300">{coupon.validHours.from} – {coupon.validHours.to}</span>
                  </p>
                )}
                <p className="text-gray-400">
                  Usos: <span className="text-gray-300">{coupon.usedCount}/{coupon.maxUses === null ? '∞' : coupon.maxUses}</span>
                </p>
                <p className="text-gray-600 text-xs">{coupon.branch?.name}</p>
              </div>

              {redeemError && (
                <p className="text-red-400 text-sm px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(248,67,49,0.1)' }}>
                  {redeemError}
                </p>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-1">
                <button onClick={handleReset}
                  className="flex items-center gap-2 flex-1 justify-center py-3 rounded-xl text-gray-400 text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <RotateCcw size={15} />
                  {redeemed ? 'Escanear otro' : 'Cancelar'}
                </button>

                {coupon.status === 'active' && !redeemed && (
                  <button onClick={handleRedeem} disabled={redeeming}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                    style={{ background: '#16a34a' }}>
                    {redeeming ? 'Canjeando...' : '✅ Canjear cupón'}
                  </button>
                )}

                {redeemed && (
                  <button onClick={handleReset}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-bold"
                    style={{ background: '#F84331' }}>
                    Siguiente cliente
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
