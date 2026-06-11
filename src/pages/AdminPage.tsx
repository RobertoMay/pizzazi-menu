import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import InstallBanner from '../components/admin/InstallBanner';

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  editor: 'Editor',
};

const ROLE_COLOR: Record<string, string> = {
  superadmin: '#F84331',
  admin: '#FACC15',
  editor: '#60a5fa',
};

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  if (!user) return null;

  return (
    <div className="menu-bg min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-4"><InstallBanner /></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Pizzazi" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-white font-black tracking-widest text-lg">PIZZAZI</h1>
              <p className="text-gray-400 text-xs">Panel de Administración</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 transition-all hover:text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Bienvenida */}
        <div
          className="rounded-2xl px-6 py-6 mb-8"
          style={{ background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-white text-2xl font-bold">Hola, {user.name} 👋</h2>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: `${ROLE_COLOR[user.role]}22`, color: ROLE_COLOR[user.role] }}
            >
              {ROLE_LABEL[user.role]}
            </span>
          </div>
          {user.branch && (
            <p className="text-gray-400 text-sm">Sucursal: <span className="text-gray-200">{user.branch.name}</span></p>
          )}
        </div>

        {/* Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Productos', desc: 'Agrega, edita u oculta productos del menú', icon: '🍕', path: '/admin/products', ready: true },
            { label: 'Promociones', desc: 'Gestiona promociones y descuentos', icon: '🎉', path: '/admin/promotions', ready: true },
            ...(user.role !== 'editor' ? [{ label: 'Usuarios', desc: 'Administra los accesos al panel', icon: '👥', path: '/admin/users', ready: true }] : []),
            ...(user.role === 'superadmin' ? [{ label: 'Sucursales', desc: 'Gestiona las sucursales', icon: '📍', path: '/admin/branches', ready: true }] : []),
            { label: 'Código QR', desc: 'Genera y descarga el QR del menú', icon: '📱', path: '/admin/qr', ready: true },
            { label: 'Clientes', desc: 'Registra y consulta clientes', icon: '🧑‍🤝‍🧑', path: '/admin/customers', ready: true },
            { label: 'Cupones', desc: 'Genera cupones QR y envíalos por WhatsApp', icon: '🎟️', path: '/admin/coupons', ready: true },
            { label: 'Escáner', desc: 'Escanea y canjea cupones de clientes', icon: '📷', path: '/admin/scanner', ready: true },
          ].map((mod) =>
            mod.ready ? (
              <Link
                key={mod.label} to={mod.path}
                className="rounded-2xl px-5 py-5 flex items-center gap-4 transition-all hover:scale-[1.01] hover:border-red-500/30"
                style={{ background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="text-3xl">{mod.icon}</span>
                <div>
                  <p className="text-white font-bold">{mod.label}</p>
                  <p className="text-gray-400 text-xs">{mod.desc}</p>
                </div>
                <span className="ml-auto flex-shrink-0 text-sm font-bold" style={{ color: '#F84331' }}>→</span>
              </Link>
            ) : (
              <div
                key={mod.label}
                className="rounded-2xl px-5 py-5 flex items-center gap-4 opacity-40 cursor-not-allowed"
                style={{ background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="text-3xl">{mod.icon}</span>
                <div>
                  <p className="text-white font-bold">{mod.label}</p>
                  <p className="text-gray-400 text-xs">{mod.desc}</p>
                </div>
                <span className="ml-auto text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Próximamente</span>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
