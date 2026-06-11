import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusCircle, Search, ChevronRight, ChevronLeft } from 'react-feather';
import AdminLayout from '../../components/admin/AdminLayout';
import CouponGeneratorModal from '../../components/admin/CouponGeneratorModal';
import CouponResultModal from '../../components/admin/CouponResultModal';
import CouponDetailModal from '../../components/admin/CouponDetailModal';
import { getCoupons } from '../../services/api';


interface Coupon {
  _id: string;
  code: string;
  customer: { name: string; phone: string };
  branch: { name: string };
  type: string;
  value?: number;
  description?: string;
  applyTo: string[];
  validFrom: string;
  validUntil: string;
  maxUses: number | null;
  usedCount: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  whatsappSent: boolean;
  whatsappError?: string | null;
  createdAt: string;
  createdBy?: { name: string };
}

const DISCOUNT_LABEL: Record<string, (v?: number) => string> = {
  percentage:   v => `${v}% descuento`,
  fixed_amount: v => `$${v}`,
  '2x1':        () => '2×1',
  free_item:    () => 'Producto gratis',
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Activo',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  used:      { label: 'Usado',     color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  expired:   { label: 'Vencido',   color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  cancelled: { label: 'Cancelado', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const APPLY_LABEL: Record<string, string> = {
  dine_in: 'Comedor', delivery: 'Domicilio', pickup: 'Para llevar',
};

export default function CouponsPage() {
  const [searchParams] = useSearchParams();
  const preCustomerId   = searchParams.get('customer');
  const preCustomerName = searchParams.get('name')  ?? '';
  const preCustomerPhone= searchParams.get('phone') ?? '';

  const [coupons,      setCoupons]      = useState<Coupon[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [query,        setQuery]        = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [showGenerator, setShowGenerator] = useState(!!preCustomerId);
  const [result,       setResult]       = useState<{ coupon: Coupon; couponUrl: string } | null>(null);
  const [selected,     setSelected]     = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (query) params.q = query;
      if (statusFilter) params.status = statusFilter;
      const data = await getCoupons(params);
      setCoupons(data.coupons as Coupon[]);
      setTotalPages(data.pages);
      setTotal(data.total);
    } finally { setLoading(false); }
  }, [query, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => { setPage(1); }, [query, statusFilter]);

  // Debounce para búsqueda de texto
  useEffect(() => {
    const t = setTimeout(() => { if (page === 1) load(); }, 300);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreated = (res: { coupon: Coupon; couponUrl: string }) => {
    setShowGenerator(false);
    setResult(res);
    setPage(1);
    load();
  };

  const handleCancelled = (id: string) => {
    setCoupons(prev => prev.map(c => c._id === id ? { ...c, status: 'cancelled' } : c));
    setSelected(prev => prev?._id === id ? { ...prev, status: 'cancelled' } : prev);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-white text-2xl font-bold">Cupones</h1>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: '#F84331' }}
          >
            <PlusCircle size={16} />
            Nuevo cupón
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          {['', 'active', 'used', 'expired', 'cancelled'].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: statusFilter === s ? '#F84331' : 'rgba(255,255,255,0.06)',
                color: statusFilter === s ? '#fff' : '#9ca3af',
              }}>
              {s === '' ? 'Todos' : STATUS_STYLE[s].label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-gray-500 animate-pulse text-center py-16">Cargando...</p>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              {query || statusFilter ? 'Sin resultados' : 'Aún no hay cupones generados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map(c => {
              const st   = STATUS_STYLE[c.status];
              const disc = DISCOUNT_LABEL[c.type]?.(c.value) ?? c.type;
              return (
                <button key={c._id}
                  onClick={() => setSelected(c)}
                  className="w-full text-left rounded-2xl px-4 py-4 flex items-center gap-3 transition-all bg-white/[0.04] hover:bg-white/[0.08] hover:scale-[1.005] active:scale-100"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {/* Status dot */}
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: st.color }} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-bold text-base">{c.customer?.name}</p>
                      <span className="text-gray-500 text-sm">{c.customer?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-red-400 text-sm font-bold">{disc}</span>
                      {c.description && <span className="text-gray-500 text-xs">{c.description}</span>}
                      {c.applyTo?.length > 0 && (
                        <span className="text-gray-600 text-xs">· {c.applyTo.map(a => APPLY_LABEL[a]).join(', ')}</span>
                      )}
                    </div>
                    {c.createdBy?.name && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                          style={{ background: 'rgba(96,165,250,0.12)', color: '#93c5fd' }}>
                          ✦ {c.createdBy.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dates + uses */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-gray-400 text-sm">
                      Hasta {new Date(c.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {c.usedCount}/{c.maxUses === null ? '∞' : c.maxUses} usos
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>

                  <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-gray-500 text-xs">{total} cupones · página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1 || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
              >
                <ChevronLeft size={15} /> Anterior
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
              >
                Siguiente <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showGenerator && (
        <CouponGeneratorModal
          prefillCustomer={preCustomerId ? { _id: preCustomerId, name: preCustomerName, phone: preCustomerPhone } : null}
          onClose={() => setShowGenerator(false)}
          onCreated={handleCreated}
        />
      )}

      {result && (
        <CouponResultModal
          coupon={result.coupon}
          couponUrl={result.couponUrl}
          onClose={() => setResult(null)}
        />
      )}

      {selected && (
        <CouponDetailModal
          coupon={selected}
          onClose={() => setSelected(null)}
          onCancelled={handleCancelled}
        />
      )}
    </AdminLayout>
  );
}
