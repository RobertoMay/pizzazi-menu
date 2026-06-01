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
  const hasMods     = hasVariants && item.modifiers?.length > 0;

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
              style={{
                background: 'linear-gradient(135deg, #F84331, #CB3F31)',
                boxShadow: '0 4px 20px rgba(248,67,49,0.6), 0 2px 8px rgba(0,0,0,0.5)',
              }}>
              🎉 {promoLabel}
            </span>
          )}
        </div>
      )}

      <div className="px-4 pt-3 pb-4">
        <h3 className="text-white font-bold text-2xl leading-tight mb-1">{item.name}</h3>

        {promoLabel && !item.image && (
          <span className="inline-block mb-2 px-4 py-1.5 rounded-full text-sm font-black text-white"
            style={{
              background: 'linear-gradient(135deg, #F84331, #CB3F31)',
              boxShadow: '0 4px 20px rgba(248,67,49,0.45)',
            }}>
            🎉 {promoLabel}
          </span>
        )}

        {item.description && (
          <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
        )}

        {/* ── 2D price table ── */}
        {hasVariants ? (
          hasMods ? (
            /* Matrix: sizes × modifiers */
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
                    <tr key={vi}
                      className="border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
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
            /* Only sizes, no modifiers */
            <div className="mt-3 space-y-0">
              {item.variants.map((v, vi) => (
                <div key={vi}
                  className="flex items-center justify-between py-2 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-gray-300 font-medium text-sm">{v.name}</span>
                  <CellPrice price={v.prices?.[0] ?? 0} promo={promotion} />
                </div>
              ))}
            </div>
          )

        ) : item.options?.length > 0 ? (
          /* ── Flat options ── */
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
          /* ── Single price ── */
          <div className="mt-3">
            <PriceDisplay price={item.price} promo={promotion} large />
          </div>
        )}
      </div>
    </div>
  );
}
