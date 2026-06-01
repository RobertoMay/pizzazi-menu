import { useEffect, useState } from 'react';
import { Download } from 'react-feather';
import { QRCodeCanvas } from 'qrcode.react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getAllBranches } from '../../services/api';

interface Branch { _id: string; name: string; slug: string; active: boolean; }

const LOGO = '/images/logo.png';

export default function QRPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      getAllBranches().then((data: Branch[]) => {
        const active = data.filter(b => b.active);
        setBranches(active);
        if (active.length) setSelected(active[0]);
        setLoading(false);
      });
    } else if (user?.branch) {
      setSelected({ _id: user.branch._id, name: user.branch.name, slug: user.branch.slug, active: true });
      setLoading(false);
    }
  }, [isSuperAdmin, user]);

  const menuUrl = selected
    ? `${window.location.origin}/${selected.slug}`
    : '';

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!selected) return;
    setDownloading(true);
    try {
      const SCALE = 3;
      const W = 380;
      const QR_SIZE = 240;
      const LOGO_SIZE = 36;
      const PAD = 32;
      const H = PAD + LOGO_SIZE + 12 + 18 + 22 + (QR_SIZE + 24) + 16 + 12 + 16 + PAD;

      const qrEl = document.getElementById('branch-qr') as HTMLCanvasElement;
      const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `${window.location.origin}${LOGO}`;
      });

      const canvas = document.createElement('canvas');
      canvas.width = W * SCALE;
      canvas.height = H * SCALE;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(SCALE, SCALE);

      // White background
      ctx.fillStyle = '#ffffff';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).roundRect(0, 0, W, H, 24);
      ctx.fill();

      let y = PAD;

      // Logo + "PIZZAZI" inline centered
      ctx.font = '900 19px "Arial Black", Arial, sans-serif';
      const tw = ctx.measureText('PIZZAZI').width;
      const brandW = LOGO_SIZE + 8 + tw;
      const brandX = (W - brandW) / 2;
      ctx.drawImage(logo, brandX, y, LOGO_SIZE, LOGO_SIZE);
      ctx.fillStyle = '#111827';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('PIZZAZI', brandX + LOGO_SIZE + 8, y + LOGO_SIZE / 2);
      y += LOGO_SIZE + 12;

      // Branch name
      ctx.font = '400 13px Arial, sans-serif';
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(selected.name, W / 2, y);
      y += 18 + 22;

      // Light box behind QR
      const boxSize = QR_SIZE + 24;
      const boxX = (W - boxSize) / 2;
      ctx.fillStyle = '#f8f8f8';
      ctx.beginPath();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).roundRect(boxX, y, boxSize, boxSize, 16);
      ctx.fill();
      ctx.drawImage(qrEl, boxX + 12, y + 12, QR_SIZE, QR_SIZE);
      y += boxSize + 16;

      // URL
      ctx.font = '400 9px monospace';
      ctx.fillStyle = '#4b5563';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(menuUrl, W / 2, y);
      y += 12 + 12;

      // "Escanea para ver el menú"
      ctx.font = '400 11px Arial, sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Escanea para ver el menú', W / 2, y);

      const link = document.createElement('a');
      link.download = `qr-${selected.slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Código QR del menú</h1>
        </div>

        {/* Branch selector — superadmin only */}
        {isSuperAdmin && branches.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {branches.map(b => (
              <button
                key={b._id}
                onClick={() => setSelected(b)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: selected?._id === b._id ? '#F84331' : 'rgba(255,255,255,0.06)',
                  color: selected?._id === b._id ? '#fff' : '#9ca3af',
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 animate-pulse py-20 text-center">Cargando...</p>
        ) : !selected ? (
          <p className="text-gray-500 py-20 text-center">No hay sucursales disponibles</p>
        ) : (
          <div className="flex flex-col items-center gap-6">

            {/* QR Card — white for printing */}
            <div
              className="rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl"
              style={{ background: '#ffffff', maxWidth: 380, width: '100%' }}
            >
              {/* Logo + brand */}
              <div className="flex items-center gap-2.5 mb-1">
                <img src={LOGO} alt="Pizzazi" className="w-9 h-9 object-contain" />
                <span className="font-black tracking-widest text-lg text-gray-900">PIZZAZI</span>
              </div>

              <p className="text-gray-700 text-sm font-medium -mt-2">{selected.name}</p>

              {/* QR */}
              <div className="p-3 rounded-2xl" style={{ background: '#f8f8f8' }}>
                <QRCodeCanvas
                  id="branch-qr"
                  value={menuUrl}
                  size={240}
                  level="H"
                  imageSettings={{
                    src: `${window.location.origin}${LOGO}`,
                    height: 48,
                    width: 48,
                    excavate: true,
                  }}
                  style={{ display: 'block', borderRadius: 8 }}
                />
              </div>

              {/* URL */}
              <p className="text-gray-600 text-xs font-mono text-center break-all px-2">
                {menuUrl}
              </p>

              <p className="text-gray-500 text-xs text-center">
                Escanea para ver el menú
              </p>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: '#F84331' }}
            >
              <Download size={18} />
              {downloading ? 'Generando...' : `Descargar QR — ${selected.name}`}
            </button>

            <p className="text-gray-600 text-xs text-center max-w-xs">
              Se descarga en formato PNG de alta resolución
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
