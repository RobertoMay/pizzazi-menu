import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusCircle, Search, XCircle } from 'react-feather';
import AdminLayout from '../../components/admin/AdminLayout';
import CouponGeneratorModal from '../../components/admin/CouponGeneratorModal';
import CouponResultModal from '../../components/admin/CouponResultModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { getCoupons, cancelCoupon } from '../../services/api';

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
}

const DISCOUNT_LABEL: Record<string, (v?: number) => string> = {
  percentage:   v => `${v}% descuento`,
  fixed_amount: v => `$${v} descuento`,
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

  const [coupons,    setCoupons]    = useState<Coupon[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [query,      setQuery]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenerator, setShowGenerator] = useState(!!preCustomerId);
  const [result,     setResult]     = useState<{ coupon: Coupon; couponUrl: string; whatsappSent: boolean; whatsappError?: string | null } | null>(null);
  const [toCancel,   setToCancel]   = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (statusFilter) params.status = statusFilter;
      const data = await getCoupons(params);
      setCoupons(data);
    } finally { setLoading(false); }
  }, [query, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [query, load]);

  const handleCreated = (res: { coupon: Coupon; couponUrl: string; whatsappSent: boolean; whatsappError?: string | null }) => {
    setCoupons(prev => [res.coupon, ...prev]);
    setShowGenerator(false);
    setResult(res);
  };

  const handleCancel = async () => {
    if (!toCancel) return;
    await cancelCoupon(toCancel._id);
    setCoupons(prev => prev.map(c => c._id === toCancel._id ? { ...c, status: 'cancelled' } : c));
    setToCancel(null);
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
          <div className="space-y-2">
            {coupons.map(c => {
              const st  = STATUS_STYLE[c.status];
              const disc = DISCOUNT_LABEL[c.type]?.(c.value) ?? c.type;
              return (
                <div key={c._id}
                  className="rounded-2xl px-4 py-3.5 flex items-center gap-3 flex-wrap"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {/* Status dot */}
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.color }} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{c.customer?.name}</p>
                      <span className="text-gray-500 text-xs">{c.customer?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-red-400 text-xs font-bold">{disc}</span>
                      {c.description && <span className="text-gray-500 text-xs">{c.description}</span>}
                      {c.applyTo?.length > 0 && (
                        <span className="text-gray-600 text-xs">· {c.applyTo.map(a => APPLY_LABEL[a]).join(', ')}</span>
                      )}
                    </div>
                  </div>

                  {/* Dates + uses */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-gray-400 text-xs">
                      Hasta {new Date(c.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {c.usedCount}/{c.maxUses === null ? '∞' : c.maxUses} usos
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>

                  {/* WhatsApp badge */}
                  <span className="text-xs flex-shrink-0" style={{ color: c.whatsappSent ? '#4ade80' : '#6b7280' }}>
                    {c.whatsappSent ? '✓ WA' : '— WA'}
                  </span>

                  {/* Cancel */}
                  {c.status === 'active' && (
                    <button onClick={() => setToCancel(c)} title="Cancelar cupón"
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <XCircle size={15} />
                    </button>
                  )}
                </div>
              );
            })}
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
          whatsappSent={result.whatsappSent}
          whatsappError={result.whatsappError}
          onClose={() => setResult(null)}
        />
      )}

      {toCancel && (
        <ConfirmModal
          message={`¿Cancelar el cupón de ${toCancel.customer?.name}? Esta acción no se puede deshacer.`}
          onConfirm={handleCancel}
          onCancel={() => setToCancel(null)}
        />
      )}
    </AdminLayout>
  );
}
