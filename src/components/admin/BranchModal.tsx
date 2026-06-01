import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'react-feather';
import { toast } from 'sonner';
import { createBranch, updateBranch } from '../../services/api';

interface Branch {
  _id: string;
  name: string;
  slug: string;
  address?: string;
  phones?: string[];
  active: boolean;
}

interface Props {
  branch?: Branch;
  onClose: () => void;
  onSaved: () => void;
}

const fieldStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const fieldClass = 'w-full rounded-xl px-4 py-3 text-white text-base outline-none transition-all placeholder-gray-600';
const focusRed = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = '#F84331'; };
const blurGray = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; };

export default function BranchModal({ branch, onClose, onSaved }: Props) {
  const isEdit = !!branch;

  const [name, setName] = useState(branch?.name ?? '');
  const [address, setAddress] = useState(branch?.address ?? '');
  const [phones, setPhones] = useState<string[]>(branch?.phones?.length ? branch.phones : ['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const addPhone = () => setPhones(p => [...p, '']);
  const removePhone = (i: number) => setPhones(p => p.filter((_, idx) => idx !== i));
  const updatePhone = (i: number, val: string) =>
    setPhones(p => p.map((v, idx) => idx === i ? val : v));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      name: name.trim(),
      address: address.trim() || undefined,
      phones: phones.map(p => p.trim()).filter(Boolean),
    };
    try {
      if (isEdit) {
        await updateBranch(branch._id, payload);
      } else {
        await createBranch(payload);
      }
      toast.success(isEdit ? 'Sucursal guardada' : 'Sucursal creada');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
          }}>
          <h2 className="text-white font-bold text-lg">
            {isEdit ? 'Editar sucursal' : 'Nueva sucursal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

          <div>
            <label className="block text-gray-300 text-sm mb-2">Nombre *</label>
            <input
              value={name} onChange={e => setName(e.target.value)} required
              placeholder="Ej. Sucursal Centro"
              className={fieldClass} style={{ ...fieldStyle }}
              onFocus={focusRed} onBlur={blurGray}
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Dirección</label>
            <input
              value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Calle, número, colonia..."
              className={fieldClass} style={{ ...fieldStyle }}
              onFocus={focusRed} onBlur={blurGray}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm">Teléfonos</label>
              <button type="button" onClick={addPhone}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                style={{ background: 'rgba(248,67,49,0.15)', color: '#F84331' }}>
                <Plus size={12} /> Agregar
              </button>
            </div>
            <div className="space-y-2">
              {phones.map((ph, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={ph}
                    onChange={e => updatePhone(i, e.target.value)}
                    placeholder="614 123 4567"
                    className={`${fieldClass} flex-1`}
                    style={{ ...fieldStyle }}
                    onFocus={focusRed} onBlur={blurGray}
                  />
                  {phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(i)}
                      className="px-3 rounded-xl text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-base font-semibold text-gray-300"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-base font-bold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: '#F84331' }}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
