import { FormEvent, useEffect, useRef, useState } from 'react';
import { ChevronDown, Image as ImageIcon, Plus, Trash2, X } from 'react-feather';
import { createProduct, updateProduct } from '../../services/api';

interface Option   { name: string; price: string; }
interface Variant  { name: string; prices: string[]; } // prices[i] = price for modifiers[i]

type PricingMode = 'single' | 'options' | 'variants';

interface Product {
  _id: string; name: string; description?: string; price: number;
  options?:   { name: string; price: number }[];
  variants?:  { name: string; prices?: number[]; price?: number }[];
  modifiers?: { name: string }[];
  image?: string; category?: string;
}
interface Category { _id: string; name: string; }
interface Props {
  product?: Product | null;
  categories: Category[];
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}

function SelectField({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-gray-300 text-sm mb-2">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-white text-base outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {children}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

const fieldStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const focusRed  = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = '#F84331'; };
const blurGray  = (e: React.FocusEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; };
const fieldClass = 'w-full rounded-xl px-4 py-3 text-white text-base outline-none transition-all placeholder-gray-600';
const priceInput = 'w-full rounded-xl pl-7 pr-3 py-3 text-white text-base outline-none transition-all';

const detectMode = (p?: Product | null): PricingMode => {
  if (p?.variants?.length)  return 'variants';
  if (p?.options?.length)   return 'options';
  return 'single';
};

const DEFAULT_MOD_NAMES = ['Sencilla', 'Orilla de queso'];
const DEFAULT_VARIANT_NAMES = ['Chico', 'Mediano', 'Grande', 'Familiar'];

const makeVariants = (modCount: number): Variant[] =>
  DEFAULT_VARIANT_NAMES.map(name => ({ name, prices: Array(Math.max(1, modCount)).fill('') }));

export default function ProductModal({ product, categories, branchId, onClose, onSaved }: Props) {
  const [pricingMode, setPricingMode] = useState<PricingMode>(detectMode(product));
  const [name,        setName]        = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price,       setPrice]       = useState(product?.price?.toString() ?? '');
  const [category,    setCategory]    = useState(() => {
    const cat = product?.category as any;
    return typeof cat === 'object' ? (cat?._id ?? '') : (cat ?? '');
  });

  const [options, setOptions] = useState<Option[]>(
    product?.options?.length
      ? product.options.map(o => ({ name: o.name, price: o.price.toString() }))
      : [{ name: 'Sencilla', price: '' }, { name: 'Con orilla de queso', price: '' }]
  );

  // modifier names only (no prices here)
  const [modNames, setModNames] = useState<string[]>(() => {
    if (product?.modifiers?.length) return product.modifiers.map(m => m.name);
    return DEFAULT_MOD_NAMES;
  });

  // variants: each has a prices[] array aligned with modNames
  const [variants, setVariants] = useState<Variant[]>(() => {
    if (product?.variants?.length) {
      return product.variants.map(v => ({
        name: v.name,
        prices: v.prices ? v.prices.map(String) : [String(v.price ?? '')],
      }));
    }
    return makeVariants(DEFAULT_MOD_NAMES.length);
  });

  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image ?? null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Options helpers
  const updateOption = (i: number, f: 'name' | 'price', v: string) =>
    setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, [f]: v } : o));

  // Modifier name helpers — keep variants.prices[] in sync
  const addModifier = () => {
    setModNames(ms => [...ms, '']);
    setVariants(vs => vs.map(v => ({ ...v, prices: [...v.prices, ''] })));
  };
  const removeModifier = (mi: number) => {
    setModNames(ms => ms.filter((_, i) => i !== mi));
    setVariants(vs => vs.map(v => ({ ...v, prices: v.prices.filter((_, i) => i !== mi) })));
  };
  const updateModName = (mi: number, val: string) =>
    setModNames(ms => ms.map((m, i) => i === mi ? val : m));

  // Variant helpers
  const addVariant = () =>
    setVariants(vs => [...vs, { name: '', prices: Array(Math.max(1, modNames.length)).fill('') }]);
  const removeVariant = (vi: number) =>
    setVariants(vs => vs.filter((_, i) => i !== vi));
  const updateVariantName = (vi: number, val: string) =>
    setVariants(vs => vs.map((v, i) => i === vi ? { ...v, name: val } : v));
  const updateVariantPrice = (vi: number, mi: number, val: string) =>
    setVariants(vs => vs.map((v, i) => i === vi
      ? { ...v, prices: v.prices.map((p, j) => j === mi ? val : p) }
      : v));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', description);
      if (category)  fd.append('category', category);
      if (branchId)  fd.append('branch', branchId);
      if (imageFile) fd.append('image', imageFile);

      if (pricingMode === 'single') {
        fd.append('price', price);
        fd.append('options',   JSON.stringify([]));
        fd.append('variants',  JSON.stringify([]));
        fd.append('modifiers', JSON.stringify([]));

      } else if (pricingMode === 'options') {
        const opts = options.filter(o => o.name.trim() && o.price)
          .map(o => ({ name: o.name.trim(), price: parseFloat(o.price) }));
        fd.append('options',   JSON.stringify(opts));
        fd.append('variants',  JSON.stringify([]));
        fd.append('modifiers', JSON.stringify([]));
        fd.append('price', opts[0]?.price?.toString() ?? '0');

      } else {
        const mods = modNames.map(n => n.trim()).filter(Boolean);
        const vars = variants
          .filter(v => v.name.trim() && v.prices.some(p => p !== ''))
          .map(v => ({
            name: v.name.trim(),
            prices: v.prices.map(p => parseFloat(p || '0')),
          }));
        if (!vars.length) { setError('Agrega al menos un tamaño con precio'); setLoading(false); return; }
        fd.append('variants',  JSON.stringify(vars));
        fd.append('modifiers', JSON.stringify(mods.map(n => ({ name: n }))));
        fd.append('options',   JSON.stringify([]));
        fd.append('price', vars[0].prices[0]?.toString() ?? '0');
      }

      if (product) await updateProduct(product._id, fd);
      else         await createProduct(fd);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const hasModifiers = modNames.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '92vh' }}>

        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-bold text-xl">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Image */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.15)' }}
              onClick={() => fileRef.current?.click()}>
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-base font-semibold">Cambiar imagen</p>
                  </div>
                </>
              ) : (
                <div className="text-center pointer-events-none">
                  <ImageIcon className="mx-auto mb-2 text-gray-600" size={32} />
                  <p className="text-gray-400 text-base">Toca para agregar imagen</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </div>

            {/* Name */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Nombre *</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="Nombre del producto"
                className={fieldClass} style={{ ...fieldStyle }}
                onFocus={focusRed} onBlur={blurGray} />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ingredientes o descripción breve" rows={2}
                className={`${fieldClass} resize-none`} style={{ ...fieldStyle }}
                onFocus={focusRed} onBlur={blurGray} />
            </div>

            {/* Category */}
            <SelectField label="Categoría" value={category} onChange={setCategory}>
              <option value="" style={{ background: '#1c1c2e' }}>Sin categoría</option>
              {categories.map(c => (
                <option key={c._id} value={c._id} style={{ background: '#1c1c2e' }}>{c.name}</option>
              ))}
            </SelectField>

            {/* Pricing mode */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Tipo de precio</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { val: 'single',   label: 'Único' },
                  { val: 'options',  label: 'Lista' },
                  { val: 'variants', label: 'Tamaños' },
                ] as { val: PricingMode; label: string }[]).map(({ val, label }) => (
                  <button key={val} type="button" onClick={() => setPricingMode(val)}
                    className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: pricingMode === val ? '#F84331' : 'rgba(255,255,255,0.06)',
                      color:      pricingMode === val ? '#fff'    : '#9ca3af',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-gray-600 text-xs mt-1.5">
                {pricingMode === 'single'   && 'Un precio fijo para el producto.'}
                {pricingMode === 'options'  && 'Varios precios en lista (ej. Chico $99, Grande $149).'}
                {pricingMode === 'variants' && 'Tamaños × extras con precio individual por combinación.'}
              </p>
            </div>

            {/* ── Single price ── */}
            {pricingMode === 'single' && (
              <div>
                <label className="block text-gray-300 text-sm mb-2">Precio *</label>
                <input type="number" min="0" step="0.01" value={price}
                  onChange={e => setPrice(e.target.value)} required placeholder="0.00"
                  className={fieldClass} style={{ ...fieldStyle }}
                  onFocus={focusRed} onBlur={blurGray} />
              </div>
            )}

            {/* ── Flat options ── */}
            {pricingMode === 'options' && (
              <div className="space-y-3">
                <label className="block text-gray-300 text-sm">Opciones</label>
                {options.map((opt, i) => (
                  <div key={i} className="rounded-xl p-4 space-y-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-medium">Opción {i + 1}</span>
                      {options.length > 1 && (
                        <button type="button" onClick={() => setOptions(o => o.filter((_, idx) => idx !== i))}
                          className="text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <input value={opt.name} onChange={e => updateOption(i, 'name', e.target.value)}
                      placeholder="Nombre" className={fieldClass} style={{ ...fieldStyle }}
                      onFocus={focusRed} onBlur={blurGray} />
                    <input type="number" min="0" step="0.01" value={opt.price}
                      onChange={e => updateOption(i, 'price', e.target.value)} placeholder="Precio"
                      className={fieldClass} style={{ ...fieldStyle }}
                      onFocus={focusRed} onBlur={blurGray} />
                  </div>
                ))}
                <button type="button" onClick={() => setOptions(o => [...o, { name: '', price: '' }])}
                  className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F84331' }}>
                  <Plus size={15} /> Agregar opción
                </button>
              </div>
            )}

            {/* ── Variants × Modifiers (2D price matrix) ── */}
            {pricingMode === 'variants' && (
              <div className="space-y-6">

                {/* Extras (modifier names) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Tipos de orilla / Extras</p>
                      <p className="text-gray-600 text-xs">Opcional — si el producto no tiene extras déjalo vacío</p>
                    </div>
                    <button type="button" onClick={addModifier}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(248,67,49,0.15)', color: '#F84331' }}>
                      <Plus size={12} /> Agregar
                    </button>
                  </div>
                  {modNames.length === 0 ? (
                    <p className="text-gray-600 text-xs italic">Sin extras — cada tamaño tendrá un precio único.</p>
                  ) : (
                    <div className="space-y-2">
                      {modNames.map((m, mi) => (
                        <div key={mi} className="flex gap-2 items-center">
                          <input value={m} onChange={e => updateModName(mi, e.target.value)}
                            placeholder="Ej. Orilla de queso"
                            className={`${fieldClass} flex-1`} style={{ ...fieldStyle }}
                            onFocus={focusRed} onBlur={blurGray} />
                          <button type="button" onClick={() => removeModifier(mi)}
                            className="p-2.5 rounded-xl text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variants with per-modifier prices */}
                <div>
                  <p className="text-gray-300 text-sm font-medium mb-3">Tamaños y precios *</p>
                  <div className="space-y-3">
                    {variants.map((v, vi) => (
                      <div key={vi} className="rounded-xl p-4 space-y-3"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

                        {/* Variant name row */}
                        <div className="flex items-center gap-2">
                          <input value={v.name} onChange={e => updateVariantName(vi, e.target.value)}
                            placeholder="Ej. Grande"
                            className={`${fieldClass} flex-1`} style={{ ...fieldStyle }}
                            onFocus={focusRed} onBlur={blurGray} />
                          {variants.length > 1 && (
                            <button type="button" onClick={() => removeVariant(vi)}
                              className="p-2.5 rounded-xl text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                              style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        {/* Price inputs: one per modifier (or one base price) */}
                        <div className="grid grid-cols-2 gap-2">
                          {hasModifiers ? (
                            modNames.map((mName, mi) => (
                              <div key={mi}>
                                <label className="block text-gray-600 text-xs mb-1 truncate">
                                  {mName || `Extra ${mi + 1}`}
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">$</span>
                                  <input type="number" min="0" step="0.01"
                                    value={v.prices[mi] ?? ''}
                                    onChange={e => updateVariantPrice(vi, mi, e.target.value)}
                                    placeholder="0.00"
                                    className={priceInput} style={{ ...fieldStyle }}
                                    onFocus={focusRed} onBlur={blurGray} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2">
                              <label className="block text-gray-600 text-xs mb-1">Precio</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">$</span>
                                <input type="number" min="0" step="0.01"
                                  value={v.prices[0] ?? ''}
                                  onChange={e => updateVariantPrice(vi, 0, e.target.value)}
                                  placeholder="0.00"
                                  className={priceInput} style={{ ...fieldStyle }}
                                  onFocus={focusRed} onBlur={blurGray} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addVariant}
                    className="flex items-center gap-2 text-sm font-semibold mt-3" style={{ color: '#F84331' }}>
                    <Plus size={15} /> Agregar tamaño
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          <div className="flex gap-3 px-5 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-base font-semibold text-gray-300"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-base font-bold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: '#F84331' }}>
              {loading ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
