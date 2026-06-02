import { useState, useEffect } from 'react';
import { X } from 'react-feather';
import { toast } from 'sonner';
import { createCustomer, updateCustomer, getAllBranches } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Branch { _id: string; name: string; }
interface Customer { _id: string; name: string; phone: string; notes: string; branch: string; }

interface Props {
  customer?: Customer | null;
  defaultBranch?: string;
  onClose: () => void;
  onSaved: (c: Customer) => void;
}

export default function CustomerModal({ customer, defaultBranch, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [name,    setName]    = useState(customer?.name    ?? '');
  const [phone,   setPhone]   = useState(customer?.phone   ?? '');
  const [notes,   setNotes]   = useState(customer?.notes   ?? '');
  const [branch,  setBranch]  = useState(customer?.branch  ?? defaultBranch ?? user?.branch?._id ?? '');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');

  useEffect(() => {
    if (isSuperAdmin) getAllBranches().then(setBranches);
  }, [isSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = phone.trim().replace(/\D/g, '');
    if (!name.trim())          { setError('El nombre es requerido'); return; }
    if (digits.length !== 10)  { setError('El teléfono debe tener exactamente 10 dígitos'); return; }
    if (!notes.trim())         { setError('La descripción es requerida'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), phone: digits, notes: notes.trim(), ...(isSuperAdmin ? { branch } : {}) };
      const saved = customer
        ? await updateCustomer(customer._id, payload)
        : await createCustomer(payload);
      toast.success(customer ? 'Cliente guardado' : 'Cliente creado');
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-red-500/50';
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{customer ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Sucursal — solo superadmin */}
          {isSuperAdmin && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Sucursal</label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className={inputCls}
                style={inputStyle}
                required
              >
                <option value="">Selecciona una sucursal</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Nombre completo *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className={inputCls}
              style={inputStyle}
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Teléfono (WhatsApp) *</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ej. 9991234567"
              className={inputCls}
              style={inputStyle}
              required
            />
            <p className="text-gray-600 text-xs mt-1">10 dígitos, sin espacios ni guiones</p>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Descripción *</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej. cliente frecuente, prefiere pizza grande, etc."
              rows={2}
              className={inputCls}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-gray-400 text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
              style={{ background: '#F84331' }}>
              {saving ? 'Guardando...' : customer ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
