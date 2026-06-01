import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'react-feather';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { label: '🍕 Productos',   path: '/admin/products',   roles: ['superadmin', 'admin', 'editor'] },
  { label: '🎉 Promociones', path: '/admin/promotions', roles: ['superadmin', 'admin', 'editor'] },
  { label: '👥 Usuarios',    path: '/admin/users',      roles: ['superadmin', 'admin'] },
  { label: '📍 Sucursales',  path: '/admin/branches',   roles: ['superadmin'] },
  { label: '📱 Código QR',  path: '/admin/qr',         roles: ['superadmin', 'admin', 'editor'] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const visibleNav = NAV.filter(n => user && n.roles.includes(user.role));

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
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
            {visibleNav.map(n => (
              <Link
                key={n.path}
                to={n.path}
                className="flex-shrink-0 px-4 py-1.5 text-sm font-semibold whitespace-nowrap rounded-full transition-all"
                style={{
                  background: location.pathname.startsWith(n.path) ? '#F84331' : 'rgba(255,255,255,0.06)',
                  color: location.pathname.startsWith(n.path) ? '#fff' : '#9ca3af',
                }}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
