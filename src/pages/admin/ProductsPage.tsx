import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Edit2, Eye, EyeOff, Plus, Search, Trash2, X } from 'react-feather';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ProductModal from '../../components/admin/ProductModal';
import { useAuth } from '../../contexts/AuthContext';
import {
  createCategory, deleteCategory, deleteProduct,
  getBranches, getCategories, getProducts, toggleProduct,
} from '../../services/api';

interface Option { name: string; price: number; }
interface Product {
  _id: string; name: string; description?: string; price: number;
  options?: Option[]; image?: string; category?: string; available: boolean; order: number;
}
interface Category { _id: string; name: string; order: number; }
interface Branch { _id: string; name: string; }

export default function ProductsPage() {
  const { user } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(user?.branch?._id ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [modalProduct, setModalProduct] = useState<Product | null | undefined>(undefined);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [confirmDialog, setConfirm] = useState<{ message: string; onConfirm: () => Promise<void> } | null>(null);
  const [confirmDialogLoading, setConfirmLoading] = useState(false);

  const branchId = user?.role === 'superadmin' ? selectedBranch : (user?.branch?._id ?? '');

  // Load branches for superadmin
  useEffect(() => {
    if (user?.role !== 'superadmin') return;
    getBranches().then((data: Branch[]) => {
      setBranches(data);
      if (!selectedBranch && data.length > 0) setSelectedBranch(data[0]._id);
    });
  }, [user]);

  const loadCategories = useCallback(async () => {
    if (!branchId) return;
    const data = await getCategories({ branch: branchId });
    setCategories(data);
  }, [branchId]);

  const loadProducts = useCallback(async () => {
    if (!branchId) return;
    setLoadingProducts(true);
    try {
      const params: Record<string, string> = { branch: branchId };
      if (activeCat !== 'all') params.category = activeCat;
      if (search.trim().length >= 2) params.q = search.trim();
      const data = await getProducts(params);
      setProducts(data);
    } finally {
      setLoadingProducts(false);
    }
  }, [branchId, activeCat, search]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  useEffect(() => {
    const t = setTimeout(loadProducts, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadProducts, search]);

  const handleToggle = async (id: string) => {
    await toggleProduct(id, branchId);
    setProducts(ps => ps.map(p => p._id === id ? { ...p, available: !p.available } : p));
  };

  const handleDelete = (product: Product) => {
    setConfirm({
      message: `"${product.name}" será eliminado permanentemente.`,
      onConfirm: async () => {
        await deleteProduct(product._id, branchId);
        setProducts(ps => ps.filter(p => p._id !== product._id));
      },
    });
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !branchId) return;
    setSavingCat(true);
    try {
      await createCategory({ name: newCatName.trim(), branch: branchId });
      setNewCatName('');
      setShowNewCat(false);
      loadCategories();
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    setConfirm({
      message: `La categoría "${cat.name}" será eliminada. Los productos no serán eliminados.`,
      onConfirm: async () => {
        await deleteCategory(cat._id);
        if (activeCat === cat._id) setActiveCat('all');
        loadCategories();
      },
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try { await confirmDialog.onConfirm(); } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const getCatId = (cat: unknown) =>
    typeof cat === 'object' && cat !== null ? (cat as { _id: string })._id : (cat as string) ?? '';

  const displayedProducts = activeCat === 'all'
    ? [...products].sort((a, b) => {
        const ai = categories.findIndex(c => c._id === getCatId(a.category));
        const bi = categories.findIndex(c => c._id === getCatId(b.category));
        if (ai !== bi) return ai - bi;
        return a.order - b.order;
      })
    : products;

  const formatPrice = (p: Product) => {
    if (p.options?.length) {
      const prices = p.options.map(o => o.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? `$${min}` : `$${min} – $${max}`;
    }
    return `$${p.price}`;
  };

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-white text-2xl font-bold">Productos</h1>
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
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => setActiveCat('all')}
          className="flex-shrink-0 px-4 py-1.5 text-sm font-semibold rounded-full transition-all"
          style={{ background: activeCat === 'all' ? '#F84331' : 'rgba(255,255,255,0.06)', color: activeCat === 'all' ? '#fff' : '#9ca3af' }}
        >
          Todas
        </button>

        {categories.map(cat => (
          <button
            key={cat._id}
            onClick={() => setActiveCat(cat._id)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all"
            style={{ background: activeCat === cat._id ? '#F84331' : 'rgba(255,255,255,0.06)', color: activeCat === cat._id ? '#fff' : '#9ca3af' }}
          >
            {cat.name}
            <span
              onClick={e => { e.stopPropagation(); handleDeleteCategory(cat); }}
              className="opacity-50 hover:opacity-100 transition-opacity leading-none"
              title="Eliminar categoría"
            >
              <X size={12} />
            </span>
          </button>
        ))}

        {showNewCat ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } if (e.key === 'Escape') setShowNewCat(false); }}
              placeholder="Nueva categoría"
              className="rounded-xl px-3 py-1.5 text-white text-sm outline-none w-36"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #F84331' }}
            />
            <button onClick={handleAddCategory} disabled={savingCat}
              className="px-3 py-1.5 rounded-xl text-sm font-bold text-white flex-shrink-0 disabled:opacity-50"
              style={{ background: '#F84331' }}>
              {savingCat ? '...' : 'Ok'}
            </button>
            <button onClick={() => { setShowNewCat(false); setNewCatName(''); }} className="text-gray-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewCat(true)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
          >
            <Plus size={13} /> Categoría
          </button>
        )}
      </div>

      {/* Search + New product */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-white text-sm outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#F84331')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>
        <button
          onClick={() => setModalProduct(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: '#F84331' }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo Producto</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Product list */}
      {loadingProducts ? (
        <p className="text-center text-gray-500 py-16 animate-pulse">Cargando productos...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-3 text-lg">No hay productos aquí</p>
          <button onClick={() => setModalProduct(null)}
            className="text-sm font-semibold transition-colors hover:opacity-80" style={{ color: '#F84331' }}>
            + Agregar el primero
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedProducts.map(product => (
            <div
              key={product._id}
              className="rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all"
              style={{
                background: 'linear-gradient(160deg, #1c1c2e 0%, #0e0e18 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                opacity: product.available ? 1 : 0.5,
              }}
            >
              {/* Thumbnail */}
              {product.image ? (
                <img src={product.image} alt={product.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  🍕
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold text-base leading-tight truncate">{product.name}</p>
                  <span
                    className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: product.available ? 'rgba(74,222,128,0.12)' : 'rgba(248,67,49,0.12)',
                      color: product.available ? '#4ade80' : '#f87171',
                    }}
                  >
                    {product.available ? 'Visible' : 'Oculto'}
                  </span>
                </div>
                {product.description && (
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{product.description}</p>
                )}
                <p className="text-sm font-bold mt-1" style={{ color: '#CB3F31' }}>{formatPrice(product)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleToggle(product._id)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  title={product.available ? 'Ocultar' : 'Mostrar'}>
                  {product.available ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => setModalProduct(product)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  title="Editar">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(product)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product modal */}
      {modalProduct !== undefined && (
        <ProductModal
          product={modalProduct}
          categories={categories}
          branchId={branchId}
          onClose={() => setModalProduct(undefined)}
          onSaved={() => { setModalProduct(undefined); loadProducts(); }}
        />
      )}

      {/* Confirm modal */}
      {confirmDialog && (
        <ConfirmModal
          message={confirmDialog.message}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          loading={confirmDialogLoading}
        />
      )}
    </AdminLayout>
  );
}
