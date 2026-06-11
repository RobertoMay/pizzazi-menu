import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Edit2, Trash2, Tag, ChevronLeft, ChevronRight } from 'react-feather';
import AdminLayout from '../../components/admin/AdminLayout';
import CustomerModal from '../../components/admin/CustomerModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { getCustomers, deleteCustomer } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Customer {
  _id: string;
  name: string;
  phone: string;
  notes: string;
  branch: string;
  createdAt: string;
  createdBy?: { name: string };
}

export default function CustomersPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [query,      setQuery]      = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [modal,      setModal]      = useState<'create' | 'edit' | null>(null);
  const [editing,    setEditing]    = useState<Customer | null>(null);
  const [toDelete,   setToDelete]   = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (query.trim()) params.q = query.trim();
      const data = await getCustomers(params);
      setCustomers(data.customers as Customer[]);
      setTotalPages(data.pages);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => { load(); }, [load]);

  // Reset a página 1 al cambiar búsqueda
  useEffect(() => { setPage(1); }, [query]);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => { if (page === 1) load(); }, 300);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaved = (saved: Customer) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c._id === saved._id);
      return idx >= 0
        ? prev.map(c => c._id === saved._id ? saved : c)
        : [saved, ...prev];
    });
    setModal(null);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteCustomer(toDelete._id);
    setCustomers(prev => prev.filter(c => c._id !== toDelete._id));
    setToDelete(null);
  };

  const openCreate = () => { setEditing(null); setModal('create'); };
  const openEdit   = (c: Customer) => { setEditing(c); setModal('edit'); };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-white text-2xl font-bold">Clientes</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: '#F84331' }}
          >
            <UserPlus size={16} />
            Nuevo cliente
          </button>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-red-500/40"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-gray-500 animate-pulse text-center py-16">Cargando...</p>
        ) : customers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              {query ? 'Sin resultados para esa búsqueda' : 'Aún no hay clientes registrados'}
            </p>
            {!query && (
              <button onClick={openCreate} className="mt-4 text-red-400 text-sm underline underline-offset-2">
                Registrar el primero
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map(c => (
              <div key={c._id}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl gap-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold text-sm truncate">{c.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{c.phone}</p>
                  {c.notes && <p className="text-gray-500 text-xs mt-0.5 truncate">{c.notes}</p>}
                </div>

                {/* Quién lo registró */}
                {user?.role === 'superadmin' && c.createdBy && (
                  <p className="text-gray-600 text-xs hidden sm:block flex-shrink-0">
                    {c.createdBy.name}
                  </p>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/admin/coupons/new?customer=${c._id}&name=${encodeURIComponent(c.name)}&phone=${encodeURIComponent(c.phone)}`)}
                    title="Generar cupón"
                    className="p-2 rounded-lg text-yellow-400 hover:text-yellow-300 transition-colors"
                    style={{ background: 'rgba(250,204,21,0.08)' }}
                  >
                    <Tag size={15} />
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    title="Editar"
                    className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setToDelete(c)}
                    title="Eliminar"
                    className="p-2 rounded-lg text-red-500/60 hover:text-red-400 transition-colors"
                    style={{ background: 'rgba(248,67,49,0.06)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-gray-500 text-xs">{total} clientes · página {page} de {totalPages}</p>
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

      {/* Modales */}
      {(modal === 'create' || modal === 'edit') && (
        <CustomerModal
          customer={modal === 'edit' ? editing : null}
          defaultBranch={user?.branch?._id}
          onClose={() => { setModal(null); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <ConfirmModal
          message={`¿Eliminar a ${toDelete.name}? También se eliminarán sus cupones.`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </AdminLayout>
  );
}
