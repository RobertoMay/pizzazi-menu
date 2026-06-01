import { useState } from 'react';

const formatPromoLabel = (promo) => {
  if (!promo) return null;
  switch (promo.type) {
    case 'special_deal': return promo.value ? `2 × $${promo.value}` : promo.title;
    case 'percentage':   return `${promo.value}% descuento`;
    case 'fixed_price':  return `$${promo.value} c/u`;
    case '2x1':          return '2 × 1';
    default:             return promo.title;
  }
};

const getDiscountedPrice = (price, promo) => {
  if (!promo || !price) return null;
  if (promo.type === 'percentage' && promo.value)
    return Math.round(price * (1 - promo.value / 100));
  if (promo.type === 'fixed_price' && promo.value)
    return promo.value;
  return null;
};

function PriceDisplay({ price, promo, color = '#CB3F31', large = false }) {
  const discounted = getDiscountedPrice(price, promo);
  const sizeClass   = large ? 'text-3xl' : 'text-xl';
  const strikeClass = large ? 'text-xl'  : 'text-base';
  if (discounted !== null) {
    return (
      <div className="flex items-baseline gap-2">
        <span className={`text-gray-500 line-through ${strikeClass}`}>${price}</span>
        <span className={`font-bold ${sizeClass}`} style={{ color: '#4ade80' }}>${discounted}</span>
      </div>
    );
  }
  return <span className={`font-bold ${sizeClass}`} style={{ color }}>${price}</span>;
}

function CellPrice({ price, promo }) {
  const discounted = getDiscountedPrice(price, promo);
  if (discounted !== null) {
    return (
      <span className="flex flex-col items-end leading-tight">
        <span className="text-gray-500 line-through text-xs">${price}</span>
        <span className="font-bold text-sm" style={{ color: '#4ade80' }}>${discounted}</span>
      </span>
    );
  }
  return <span className="font-bold text-sm" style={{ color: '#F84331' }}>${price}</span>;
}

export default function MenuItem({ item, promotion }) {
  const promoLabel  = formatPromoLabel(promotion);
  const hasVariants = item.variants?.length > 0;

  // Detectar formato: nuevo (modifiers por variante) vs legado (modifiers globales)
  const isNewFormat  = hasVariants && item.variants.some(v => v.modifiers?.length > 0);
  const isLegacy     = hasVariants && !isNewFormat && item.modifiers?.length > 0;

  const [selVI, setSelVI] = useState(0);
  const [selMI, setSelMI] = useState(0);

  // Para el formato nuevo: los extras del tamaño seleccionado pueden variar
  const selectedVariant = hasVariants ? item.variants[selVI] : null;
  const variantMods     = selectedVariant?.modifiers ?? [];
  const hasVarMods      = variantMods.length > 0;

  // Precio para el formato interactivo (nuevo formato)
  const interactivePrice = isNewFormat
    ? (hasVarMods ? (variantMods[selMI]?.price ?? 0) : (selectedVariant?.price ?? selectedVariant?.prices?.[0] ?? 0))
    : null;

  const pill = 'px-3 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer select-none border';

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_0_16px_rgba(248,67,49,0.15)] hover:ring-1 hover:ring-red-500/20 cursor-pointer"
      style={{ background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)' }}
    >
      {item.image && (
        <div className="relative overflow-hidden">
          <img src={item.image} alt={item.name}
            className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-110" />
          {promoLabel && (
            <span className="absolute top-2.5 left-2.5 px-4 py-1.5 rounded-full text-sm font-black text-white"
              style={{ background: 'linear-gradient(135deg, #F84331, #CB3F31)', boxShadow: '0 4px 20px rgba(248,67,49,0.6)' }}>
              🎉 {promoLabel}
            </span>
          )}
        </div>
      )}

      <div className="px-4 pt-3 pb-4">
        <h3 className="text-white font-bold text-2xl leading-tight mb-1">{item.name}</h3>

        {promoLabel && !item.image && (
          <span className="inline-block mb-2 px-4 py-1.5 rounded-full text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg, #F84331, #CB3F31)', boxShadow: '0 4px 20px rgba(248,67,49,0.45)' }}>
            🎉 {promoLabel}
          </span>
        )}

        {item.description && (
          <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
        )}

        {/* ── Nuevo formato: selector interactivo (extras per variante) ── */}
        {isNewFormat ? (
          <div className="mt-3 space-y-2.5">
            {/* Tamaños */}
            <div className="flex flex-wrap gap-1.5">
              {item.variants.map((v, i) => (
                <button key={i} type="button"
                  onClick={() => { setSelVI(i); setSelMI(0); }}
                  className={pill}
                  style={{
                    background:  selVI === i ? '#F84331'               : 'rgba(255,255,255,0.07)',
                    color:       selVI === i ? '#fff'                  : '#d1d5db',
                    borderColor: selVI === i ? '#F84331'               : 'rgba(255,255,255,0.1)',
                  }}>
                  {v.name}
                </button>
              ))}
            </div>

            {/* Extras del tamaño seleccionado */}
            {hasVarMods && (
              <div className="flex flex-wrap gap-1.5">
                {variantMods.map((m, i) => (
                  <button key={i} type="button" onClick={() => setSelMI(i)}
                    className={pill}
                    style={{
                      background:  selMI === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                      color:       selMI === i ? '#fff'                   : '#9ca3af',
                      borderColor: selMI === i ? 'rgba(255,255,255,0.3)'  : 'rgba(255,255,255,0.08)',
                    }}>
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-0.5">
              <PriceDisplay price={interactivePrice} promo={promotion} large />
            </div>
          </div>

        ) : isLegacy ? (
          /* ── Legado: tabla completa (modifiers globales + prices[]) ── */
          item.modifiers.length > 1 ? (
            <div className="mt-3 overflow-x-auto -mx-1 px-1">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="pb-1.5 pr-3 text-left text-gray-500 font-normal text-xs w-24" />
                    {item.modifiers.map((m, i) => (
                      <th key={i} className="pb-1.5 px-2 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">
                        {m.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.variants.map((v, vi) => (
                    <tr key={vi} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <td className="py-2 pr-3 text-gray-300 font-medium text-sm whitespace-nowrap">{v.name}</td>
                      {item.modifiers.map((_, mi) => (
                        <td key={mi} className="py-2 px-2 text-center">
                          <CellPrice price={v.prices?.[mi] ?? 0} promo={promotion} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 space-y-0">
              {item.variants.map((v, vi) => (
                <div key={vi} className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-gray-300 font-medium text-sm">{v.name}</span>
                  <CellPrice price={v.prices?.[0] ?? 0} promo={promotion} />
                </div>
              ))}
            </div>
          )

        ) : hasVariants ? (
          /* ── Solo tamaños sin extras ── */
          <div className="mt-3 space-y-0">
            {item.variants.map((v, vi) => (
              <div key={vi} className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-gray-300 font-medium text-sm">{v.name}</span>
                <CellPrice price={v.price ?? v.prices?.[0] ?? 0} promo={promotion} />
              </div>
            ))}
          </div>

        ) : item.options?.length > 0 ? (
          /* ── Lista de opciones ── */
          <div className="flex flex-col gap-2 mt-3">
            {item.options.map((opt, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '20px' }}>
                <p className="text-gray-200 text-base">{opt.name}</p>
                <PriceDisplay price={opt.price} promo={promotion} color={i === 0 ? '#CB3F31' : '#FACC15'} />
              </div>
            ))}
          </div>

        ) : (
          /* ── Precio único ── */
          <div className="mt-3">
            <PriceDisplay price={item.price} promo={promotion} large />
          </div>
        )}
      </div>
    </div>
  );
}
