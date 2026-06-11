import { useEffect, useReducer, useState } from 'react';
import { Download, X } from 'react-feather';
import { getInstallPrompt, clearInstallPrompt, subscribeInstallPrompt } from '../../utils/installPrompt';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

const isIOSSafari = () => {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
};

export default function InstallBanner() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('installBannerDismissed') === '1'
  );
  const [iosHint] = useState(() => !isStandalone() && isIOSSafari());

  // Re-renderiza cuando se capture el evento (puede ocurrir antes o después del mount)
  useEffect(() => subscribeInstallPrompt(forceUpdate), []);

  const installPrompt = getInstallPrompt();

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') clearInstallPrompt();
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('installBannerDismissed', '1');
  };

  if (dismissed) return null;

  if (installPrompt) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
        style={{ background: 'rgba(248,67,49,0.12)', border: '1px solid rgba(248,67,49,0.25)' }}>
        <Download size={15} className="text-red-400 flex-shrink-0" />
        <p className="flex-1 text-sm text-gray-300 leading-tight">
          Instala la app para acceso rápido desde tu pantalla de inicio
        </p>
        <button onClick={handleInstall}
          className="px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0"
          style={{ background: '#F84331', color: '#fff' }}>
          Instalar
        </button>
        <button onClick={handleDismiss} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
          <X size={15} />
        </button>
      </div>
    );
  }

  if (iosHint) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
        style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
        <Download size={15} className="text-blue-400 flex-shrink-0" />
        <p className="flex-1 text-sm text-gray-300 leading-tight">
          Para instalar: toca <span className="text-white font-semibold">Compartir ↑</span> → <span className="text-white font-semibold">Añadir a pantalla de inicio</span>
        </p>
        <button onClick={handleDismiss} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
          <X size={15} />
        </button>
      </div>
    );
  }

  return null;
}
