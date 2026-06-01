import { FormEvent, useEffect, useState } from 'react';
import { X } from 'react-feather';
import { createPromotion, getProducts, updatePromotion } from '../../services/api';

type PromoType = 'special_deal' | 'percentage' | 'fixed_price' | '2x1';
type Scope = 'category' | 'products';

interface Category { _id: string; name: string; }
interface ProductItem { _id: string; name: string; image?: string; }
interface Promotion {
  _id: string; title: string; description?: string;
  category?: { _id: string; name: string } | string | null;
  products?: { _id: string; name: string }[] | string[];
  type: PromoType; value?: number;
  days: number[]; allDay: boolean; startTime?: string; endTime?: string; active: boolean;
}
interface Props {
  promotion?: Promotion | null;
  categories: Category[];
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const TYPE_OPTIONS: { value: PromoType; label: string; valuePlaceholder?: string; valueLabel?: string }[] = [
  { value: 'special_deal', label: '2 × precio',  valueLabel: '2 ítems por $',  valuePlaceholder: '199' },
  { value: 'percentage',   label: '% Descuento', valueLabel: '% de descuento', valuePlaceholder: '10'  },
  { value: 'fixed_price',  label: 'Precio fijo', valueLabel: 'Precio c/u ($)',  valuePlaceholder: '149' },
  { value: '2x1',          label: '2 × 1',       valueLabel: undefined,         valuePlaceholder: undefined },
];

const fieldStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const fieldClass = 'w-full rounded-xl px-4 py-3 text-white text-base outline-none transition-all placeholder-gray-600';
const focusRed = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = '#F84331'; };
const blurGray = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; };

const getCatId = (cat: unknown): string =>
  typeof cat === 'object' && cat !== null ? (cat as { _id: string })._id : (cat as string) ?? '';

const getProdId = (p: unknown): string =>
  typeof p === 'object' && p !== null ? (p as { _id: string })._id : (p as string) ?? '';

export default function PromotionModal({ promotion, categories, branchId, onClose, onSaved }: Props) {
  const existingProducts = promotion?.products ?? [];
  const initialScope: Scope = existingProducts.length > 0 ? 'products' : 'category';

  const [title, setTitle] = useState(promotion?.title ?? '');
  const [description, setDescription] = useState(promotion?.description ?? '');
  const [category, setCategory] = useState(getCatId(promotion?.category));
  const [scope, setScope] = useState<Scope>(initialScope);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    existingProducts.map(getProdId)
  );
  const [productList, setProductList] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [type, setType] = useState<PromoType>(promotion?.type ?? 'special_deal');
  const [value, setValue] = useState(promotion?.value?.toString() ?? '');
  const [days, setDays] = useState<number[]>(promotion?.days ?? []);
  const [allDay, setAllDay] = useState(promotion?.allDay ?? true);
  const [startTime, setStartTime] = useState(promotion?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(promotion?.endTime ?? '21:00');
  const [active, setActive] = useState(promotion?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Fetch products when scope = 'products'
  useEffect(() => {
    if (scope !== 'products') return;
    setLoadingProducts(true);
    const params: Record<string, string> = { branch: branchId };
    if (category) params.category = category;
    getProducts(params)
      .then((data: ProductItem[]) => setProductList(data))
      .finally(() => setLoadingProducts(false));
  }, [scope, category, branchId]);

  const toggleDay = (d: number) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b));

  const toggleProduct = (id: string) =>
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedType = TYPE_OPTIONS.find(t => t.value === type)!;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (scope === 'products' && selectedProducts.length === 0) {
      setError('Selecciona al menos un producto');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || null,
        products: scope === 'products' ? selectedProducts : [],
        type,
        value: type !== '2x1' && value ? parseFloat(value) : undefined,
        days,
        allDay,
        startTime: allDay ? undefined : startTime,
        endTime: allDay ? undefined : endTime,
        active,
        branch: branchId,
      };
      if (promotion) {
        await updatePromotion(promotion._id, payload);
      } else {
        await createPromotion(payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-bold text-xl">
            {promotion ? 'Editar promoción' : 'Nueva promoción'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Title */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Título *</label>
              <input
                value={title} onChange={e => setTitle(e.target.value)} required
                placeholder="Ej. Miércoles de pizzas"
                className={fieldClass} style={{ ...fieldStyle }}
                onFocus={focusRed} onBlur={blurGray}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Descripción</label>
              <input
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Texto extra para el cliente (opcional)"
                className={fieldClass} style={{ ...fieldStyle }}
                onFocus={focusRed} onBlur={blurGray}
              />
            </div>

            {/* Scope toggle */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Aplica a</label>
              <div className="flex gap-2">
                {(['category', 'products'] as Scope[]).map(s => (
                  <button key={s} type="button" onClick={() => setScope(s)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: scope === s ? '#F84331' : 'rgba(255,255,255,0.06)',
                      color: scope === s ? '#fff' : '#9ca3af',
                    }}>
                    {s === 'category' ? 'Categoría / Global' : 'Productos específicos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category (shown always; used as filter for product picker too) */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                {scope === 'products' ? 'Filtrar por categoría (opcional)' : 'Categoría'}
              </label>
              <div className="relative">
                <select
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-white text-base outline-none"
                  style={fieldStyle}
                >
                  <option value="" style={{ background: '#1c1c2e' }}>
                    {scope === 'products' ? 'Todas las categorías' : 'Global (todas las categorías)'}
                  </option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id} style={{ background: '#1c1c2e' }}>{c.name}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Product picker */}
            {scope === 'products' && (
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Productos *
                  {selectedProducts.length > 0 && (
                    <span className="ml-2 text-xs font-bold" style={{ color: '#F84331' }}>
                      {selectedProducts.length} seleccionado(s)
                    </span>
                  )}
                </label>
                {loadingProducts ? (
                  <p className="text-gray-500 text-sm animate-pulse py-3">Cargando productos...</p>
                ) : productList.length === 0 ? (
                  <p className="text-gray-500 text-sm py-3">No hay productos en esta categoría</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {productList.map(p => {
                      const checked = selectedProducts.includes(p._id);
                      return (
                        <button
                          key={p._id} type="button" onClick={() => toggleProduct(p._id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                          style={{
                            background: checked ? 'rgba(248,67,49,0.12)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${checked ? 'rgba(248,67,49,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                              style={{ background: 'rgba(255,255,255,0.05)' }}>🍕</div>
                          )}
                          <span className="text-white text-sm font-medium flex-1">{p.name}</span>
                          <span
                            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black transition-all"
                            style={{
                              background: checked ? '#F84331' : 'rgba(255,255,255,0.1)',
                              color: '#fff',
                            }}
                          >
                            {checked ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Type */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Tipo de promoción</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                    className="py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: type === opt.value ? '#F84331' : 'rgba(255,255,255,0.06)',
                      color: type === opt.value ? '#fff' : '#9ca3af',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Value */}
            {selectedType.valueLabel && (
              <div>
                <label className="block text-gray-300 text-sm mb-2">{selectedType.valueLabel}</label>
                <input
                  type="number" min="0" step="0.01"
                  value={value} onChange={e => setValue(e.target.value)}
                  required placeholder={selectedType.valuePlaceholder}
                  className={fieldClass} style={{ ...fieldStyle }}
                  onFocus={focusRed} onBlur={blurGray}
                />
              </div>
            )}

            {/* Days */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Días de la semana</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_ORDER.map(d => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: days.includes(d) ? '#F84331' : 'rgba(255,255,255,0.06)',
                      color: days.includes(d) ? '#fff' : '#9ca3af',
                    }}>
                    {DAY_LABELS[d]}
                  </button>
                ))}
              </div>
              <p className="text-gray-600 text-xs mt-1.5">Sin selección = aplica todos los días</p>
            </div>

            {/* Time */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-300 text-sm">Horario</label>
                <button type="button" onClick={() => setAllDay(v => !v)}
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: allDay ? '#F84331' : '#9ca3af' }}>
                  <span className="w-9 h-5 rounded-full flex items-center px-0.5 transition-colors"
                    style={{ background: allDay ? '#F84331' : 'rgba(255,255,255,0.12)' }}>
                    <span className="w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ transform: allDay ? 'translateX(16px)' : 'translateX(0)' }} />
                  </span>
                  Todo el día
                </button>
              </div>
              {!allDay && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-gray-500 text-xs mb-1.5">Desde</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                      className={fieldClass} style={{ ...fieldStyle }}
                      onFocus={focusRed} onBlur={blurGray} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-500 text-xs mb-1.5">Hasta</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                      className={fieldClass} style={{ ...fieldStyle }}
                      onFocus={focusRed} onBlur={blurGray} />
                  </div>
                </div>
              )}
            </div>

            {/* Active */}
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-300 text-sm">Promoción activa</span>
              <button type="button" onClick={() => setActive(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: active ? '#4ade80' : '#9ca3af' }}>
                <span className="w-9 h-5 rounded-full flex items-center px-0.5 transition-colors"
                  style={{ background: active ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.12)' }}>
                  <span className="w-4 h-4 rounded-full shadow transition-transform"
                    style={{ background: active ? '#4ade80' : '#9ca3af', transform: active ? 'translateX(16px)' : 'translateX(0)' }} />
                </span>
                {active ? 'Activa' : 'Inactiva'}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-base font-semibold text-gray-300 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#F84331' }}>
              {loading ? 'Guardando...' : promotion ? 'Guardar cambios' : 'Crear promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
