import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'react-feather';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin/dashboard');
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="menu-bg min-h-screen flex items-center justify-center px-4 pb-20">
      <div className="w-full max-w-sm">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <img
            src="/images/logo.png"
            alt="Pizzazi"
            className="w-28 h-28 object-contain mx-auto mb-4 drop-shadow-2xl"
          />
          <h1 className="text-white text-3xl font-black tracking-widest">PIZZAZI</h1>
          <p className="text-gray-400 text-sm mt-1">Panel de Administración</p>
        </div>

        {/* Card de login */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl px-6 py-8 space-y-5"
          style={{
            background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div>
            <label className="block text-gray-400 text-sm mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Tu nombre de usuario"
              className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#F84331')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : (password.length > 0 ? 'password' : 'text')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-11 text-white text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#F84331')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: '#F84331' }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

      </div>
    </div>
  );
}
