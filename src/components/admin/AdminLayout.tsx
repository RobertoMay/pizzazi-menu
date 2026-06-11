import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Download, X } from 'react-feather';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { label: '🍕 Productos',   path: '/admin/products',   roles: ['superadmin', 'admin', 'editor'] },
  { label: '🎉 Promociones', path: '/admin/promotions', roles: ['superadmin', 'admin', 'editor'] },
  { label: '👥 Usuarios',    path: '/admin/users',      roles: ['superadmin', 'admin'] },
  { label: '📍 Sucursales',  path: '/admin/branches',   roles: ['superadmin'] },
  { label: '📱 Código QR',  path: '/admin/qr',         roles: ['superadmin', 'admin', 'editor'] },
  { label: '🧑‍🤝‍🧑 Clientes',  path: '/admin/customers',  roles: ['superadmin', 'admin', 'editor'] },
  { label: '🎟️ Cupones',    path: '/admin/coupons',    roles: ['superadmin', 'admin', 'editor'] },
  { label: '📷 Escáner',    path: '/admin/scanner',    roles: ['superadmin', 'admin', 'editor'] },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const navRef    = useRef<HTMLDivElement>(null);

  const [installPrompt,  setInstallPrompt]  = useState<BeforeInstallPromptEvent | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem('installBannerDismissed') === '1'
  );

  // Captura el evento solo en Android/Chrome — en iOS nunca se dispara
  useEffect(() => {
    if (isStandalone()) return; // ya está instalada
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
  }, [location.pathname]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setBannerDismissed(true);
    localStorage.setItem('installBannerDismissed', '1');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const visibleNav   = NAV.filter(n => user && n.roles.includes(user.role));
  const showBanner   = !!installPrompt && !bannerDismissed;

  return (
    <div className="menu-bg min-h-screen">
      <div
        className="sticky top-0 z-20"
        style={{
          background: 'rgba(6,6,18,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between px-4 h-14">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
              <img src="/images/logo.png" alt="Pizzazi" className="w-8 h-8 object-contain" />
              <span className="text-white font-black tracking-widest text-sm hidden sm:block">PIZZAZI</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-semibold leading-tight">{user?.name}</p>
                <p className="text-gray-500 text-xs">{user?.branch?.name ?? 'Super Admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Nav pills */}
          <div ref={navRef} className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
            {visibleNav.map(n => {
              const active = location.pathname.startsWith(n.path);
              return (
                <Link
                  key={n.path}
                  to={n.path}
                  data-active={active ? 'true' : undefined}
                  className="flex-shrink-0 px-4 py-1.5 text-sm font-semibold whitespace-nowrap rounded-full transition-all"
                  style={{
                    background: active ? '#F84331' : 'rgba(255,255,255,0.06)',
                    color: active ? '#fff' : '#9ca3af',
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Banner de instalación — solo Android cuando el evento está disponible */}
        {showBanner && (
          <div className="max-w-7xl mx-auto px-4 pb-3">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(248,67,49,0.12)', border: '1px solid rgba(248,67,49,0.25)' }}>
              <Download size={15} className="text-red-400 flex-shrink-0" />
              <p className="flex-1 text-sm text-gray-300 leading-tight">
                Instala la app para acceso rápido desde tu pantalla de inicio
              </p>
              <button
                onClick={handleInstall}
                className="px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0"
                style={{ background: '#F84331', color: '#fff' }}
              >
                Instalar
              </button>
              <button onClick={handleDismiss} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
                <X size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
