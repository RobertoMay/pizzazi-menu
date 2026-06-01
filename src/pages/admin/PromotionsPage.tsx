import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Edit2, Eye, EyeOff, Plus, Trash2 } from 'react-feather';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import PromotionModal from '../../components/admin/PromotionModal';
import { useAuth } from '../../contexts/AuthContext';
import {
  deletePromotion, getBranches, getCategories, getPromotions, togglePromotion,
} from '../../services/api';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

type PromoType = 'special_deal' | 'percentage' | 'fixed_price' | '2x1';
interface PromoCategory { _id: string; name: string; }
interface Promotion {
  _id: string; title: string; description?: string;
  category?: PromoCategory | null;
  products?: { _id: string; name: string }[];
  type: PromoType; value?: number;
  days: number[]; allDay: boolean; startTime?: string; endTime?: string;
  active: boolean; isActiveNow?: boolean;
}
interface Category { _id: string; name: string; }
interface Branch { _id: string; name: string; }

const formatPromoLabel = (p: Promotion) => {
  switch (p.type) {
    case 'special_deal': return p.value ? `2 × $${p.value}` : '2 × precio especial';
    case 'percentage':   return `${p.value}% descuento`;
    case 'fixed_price':  return `$${p.value} c/u`;
    case '2x1':          return '2 × 1';
    default:             return p.title;
  }
};

export default function PromotionsPage() {
  const { user } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(user?.branch?._id ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPromo, setModalPromo] = useState<Promotion | null | undefined>(undefined);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => Promise<void> } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const branchId = user?.role === 'superadmin' ? selectedBranch : (user?.branch?._id ?? '');

  useEffect(() => {
    if (user?.role !== 'superadmin') return;
    getBranches().then((data: Branch[]) => {
      setBranches(data);
      if (!selectedBranch && data.length > 0) setSelectedBranch(data[0]._id);
    });
  }, [user]);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [promos, cats] = await Promise.all([
        getPromotions({ branch: branchId }),
        getCategories({ branch: branchId }),
      ]);
      setPromotions(promos);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string) => {
    await togglePromotion(id, user?.role === 'superadmin' ? branchId : undefined);
    setPromotions(ps => ps.map(p => p._id === id ? { ...p, active: !p.active } : p));
  };

  const handleDelete = (promo: Promotion) => {
    setConfirmDialog({
      message: `"${promo.title}" será eliminada permanentemente.`,
      onConfirm: async () => {
        await deletePromotion(promo._id, user?.role === 'superadmin' ? branchId : undefined);
        setPromotions(ps => ps.filter(p => p._id !== promo._id));
      },
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try { await confirmDialog.onConfirm(); } finally {
      setConfirmLoading(false);
      setConfirmDialog(null);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-white text-2xl font-bold">Promociones</h1>
        <div className="flex items-center gap-3">
          {user?.role === 'superadmin' && branches.length > 0 && (
            <div className="relative">
              <select
                value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                className="appearance-none text-white text-base rounded-xl px-4 py-2.5 pr-9 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {branches.map(b => (
                  <option key={b._id} value={b._id} style={{ background: '#1c1c2e' }}>{b.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={() => setModalPromo(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: '#F84331' }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva Promoción</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-500 py-16 animate-pulse">Cargando promociones...</p>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-3 text-lg">No hay promociones todavía</p>
          <button onClick={() => setModalPromo(null)}
            className="text-sm font-semibold transition-colors hover:opacity-80" style={{ color: '#F84331' }}>
            + Crear la primera
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map(promo => {
            const isProductLevel = (promo.products?.length ?? 0) > 0;
            const targetLabel = isProductLevel
              ? promo.products!.map(p => p.name).join(', ')
              : promo.category ? promo.category.name : 'Global';
            const promoLabel = formatPromoLabel(promo);
            const daysToShow = promo.days.length > 0
              ? DAY_ORDER.filter(d => promo.days.includes(d))
              : null;

            return (
              <div
                key={promo._id}
                className="rounded-2xl p-4 flex items-start gap-4 transition-all"
                style={{
                  background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: promo.active ? 1 : 0.55,
                }}
              >
                <div className="flex-1 min-w-0">
                  {/* Title + badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-white font-bold text-base">{promo.title}</p>
                    {promo.isActiveNow && (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        Activa ahora
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: promo.active ? 'rgba(74,222,128,0.1)' : 'rgba(248,67,49,0.1)',
                        color: promo.active ? '#4ade80' : '#f87171',
                      }}>
                      {promo.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Target + type */}
                  <div className="text-sm mb-2">
                    <span className="text-gray-400">
                      {isProductLevel && <span className="text-xs text-gray-600 mr-1">Productos:</span>}
                      {targetLabel}
                    </span>
                    <span className="text-gray-600 mx-2">·</span>
                    <span className="font-bold" style={{ color: '#F84331' }}>{promoLabel}</span>
                    {promo.description && (
                      <span className="text-gray-500 ml-2">— {promo.description}</span>
                    )}
                  </div>

                  {/* Days + time */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {daysToShow ? (
                      daysToShow.map(d => (
                        <span key={d}
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(248,67,49,0.15)', color: '#F84331' }}>
                          {DAY_LABELS[d]}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">Todos los días</span>
                    )}
                    <span className="text-gray-700 text-xs">·</span>
                    <span className="text-xs text-gray-500">
                      {promo.allDay ? 'Todo el día' : `${promo.startTime} – ${promo.endTime}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <button onClick={() => handleToggle(promo._id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    title={promo.active ? 'Desactivar' : 'Activar'}>
                    {promo.active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => setModalPromo(promo)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(promo)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Promotion modal */}
      {modalPromo !== undefined && (
        <PromotionModal
          promotion={modalPromo}
          categories={categories}
          branchId={branchId}
          onClose={() => setModalPromo(undefined)}
          onSaved={() => { setModalPromo(undefined); load(); }}
        />
      )}

      {/* Confirm modal */}
      {confirmDialog && (
        <ConfirmModal
          message={confirmDialog.message}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDialog(null)}
          loading={confirmLoading}
        />
      )}
    </AdminLayout>
  );
}
