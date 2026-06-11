const API = import.meta.env.VITE_API_URL as string;

const fetchJSON = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const authFetchForm = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// ── Public ────────────────────────────────────────────────────────
export const getBranches = () => fetchJSON(`${API}/branches`);
export const getBranchBySlug = (slug: string) => fetchJSON(`${API}/branches/slug/${slug}`);
export const getMenu = (branchId: string) => fetchJSON(`${API}/menu?branch=${branchId}`);

// ── Auth ──────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  fetchJSON(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

export const getMe = () => authFetch(`${API}/auth/me`);
export const logout = () => authFetch(`${API}/auth/logout`, { method: 'POST' });

// ── Products ──────────────────────────────────────────────────────
export const getProducts = (params: Record<string, string> = {}) =>
  authFetch(`${API}/products?${new URLSearchParams(params)}`);

export const createProduct = (formData: FormData) =>
  authFetchForm(`${API}/products`, { method: 'POST', body: formData });

export const updateProduct = (id: string, formData: FormData) =>
  authFetchForm(`${API}/products/${id}`, { method: 'PUT', body: formData });

export const toggleProduct = (id: string, branchId?: string) =>
  authFetch(`${API}/products/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ branch: branchId }),
  });

export const deleteProduct = (id: string, branchId?: string) =>
  authFetch(`${API}/products/${id}${branchId ? `?branch=${branchId}` : ''}`, { method: 'DELETE' });

export const reorderProducts = (items: { _id: string; order: number }[]) =>
  authFetch(`${API}/products/reorder`, { method: 'PATCH', body: JSON.stringify({ items }) });

// ── Categories ────────────────────────────────────────────────────
export const getCategories = (params: Record<string, string> = {}) =>
  authFetch(`${API}/categories?${new URLSearchParams(params)}`);

export const createCategory = (data: object) =>
  authFetch(`${API}/categories`, { method: 'POST', body: JSON.stringify(data) });

export const updateCategory = (id: string, data: object) =>
  authFetch(`${API}/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCategory = (id: string) =>
  authFetch(`${API}/categories/${id}`, { method: 'DELETE' });

// ── Promotions ─────────────────────────────────────────────────────
export const getPromotions = (params: Record<string, string> = {}) =>
  authFetch(`${API}/promotions?${new URLSearchParams(params)}`);

export const createPromotion = (data: object) =>
  authFetch(`${API}/promotions`, { method: 'POST', body: JSON.stringify(data) });

export const updatePromotion = (id: string, data: object) =>
  authFetch(`${API}/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const togglePromotion = (id: string, branchId?: string) =>
  authFetch(`${API}/promotions/${id}/toggle${branchId ? `?branch=${branchId}` : ''}`, { method: 'PATCH' });

export const deletePromotion = (id: string, branchId?: string) =>
  authFetch(`${API}/promotions/${id}${branchId ? `?branch=${branchId}` : ''}`, { method: 'DELETE' });

// ── Branches (admin) ──────────────────────────────────────────────
export const getAllBranches = () => authFetch(`${API}/branches/all`);

export const createBranch = (data: object) =>
  authFetch(`${API}/branches`, { method: 'POST', body: JSON.stringify(data) });

export const updateBranch = (id: string, data: object) =>
  authFetch(`${API}/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const toggleBranch = (id: string) =>
  authFetch(`${API}/branches/${id}/toggle`, { method: 'PATCH' });

export const deleteBranch = (id: string) =>
  authFetch(`${API}/branches/${id}`, { method: 'DELETE' });

// ── Users ──────────────────────────────────────────────────────────
export const getUsers = (params: Record<string, string> = {}) =>
  authFetch(`${API}/users?${new URLSearchParams(params)}`);

export const createUser = (data: object) =>
  authFetch(`${API}/users`, { method: 'POST', body: JSON.stringify(data) });

export const deleteUser = (id: string) =>
  authFetch(`${API}/users/${id}`, { method: 'DELETE' });

export const changeUserPassword = (id: string, newPassword: string) =>
  authFetch(`${API}/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) });

export const toggleUser = (id: string) =>
  authFetch(`${API}/users/${id}/toggle`, { method: 'PATCH' });

// ── Customers ──────────────────────────────────────────────────────
export const getCustomers = (params: Record<string, string> = {}) =>
  authFetch(`${API}/customers?${new URLSearchParams(params)}`);

export const createCustomer = (data: object) =>
  authFetch(`${API}/customers`, { method: 'POST', body: JSON.stringify(data) });

export const updateCustomer = (id: string, data: object) =>
  authFetch(`${API}/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCustomer = (id: string) =>
  authFetch(`${API}/customers/${id}`, { method: 'DELETE' });

// ── Coupons ──────────────────────────────────────────────────────
export const getCoupons = (params: Record<string, string> = {}) =>
  authFetch(`${API}/coupons?${new URLSearchParams(params)}`) as Promise<{
    coupons: unknown[]; total: number; page: number; pages: number;
  }>;

export const createCoupon = (data: object) =>
  authFetch(`${API}/coupons`, { method: 'POST', body: JSON.stringify(data) });

export const cancelCoupon = (id: string) =>
  authFetch(`${API}/coupons/${id}/cancel`, { method: 'PATCH' });

export const resendCoupon = (id: string) =>
  authFetch(`${API}/coupons/${id}/resend`, { method: 'PATCH' });

export const getCouponPublic = (code: string) =>
  fetchJSON(`${API}/coupons/public/${code}`);

export const redeemCouponPublic = (code: string) =>
  fetchJSON(`${API}/coupons/redeem/${code}`, { method: 'POST' });

// ── Push notifications ─────────────────────────────────────────────
export const getVapidKey = () =>
  fetchJSON(`${API}/push/vapid-key`) as Promise<{ publicKey: string }>;

export const subscribePush = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
  authFetch(`${API}/push/subscribe`, { method: 'POST', body: JSON.stringify({ subscription: sub }) });

export const unsubscribePush = (endpoint: string) =>
  authFetch(`${API}/push/unsubscribe`, { method: 'POST', body: JSON.stringify({ endpoint }) });

export const getPushSettings = () =>
  authFetch(`${API}/push/settings`) as Promise<{
    enabled: boolean; excludedUsers: string[]; hasSubscription: boolean;
  }>;

export const updatePushSettings = (data: { enabled?: boolean; excludedUsers?: string[] }) =>
  authFetch(`${API}/push/settings`, { method: 'PATCH', body: JSON.stringify(data) });

// ── Coupon perms ───────────────────────────────────────────────────
export const updateCouponPerms = (id: string, data: object) =>
  authFetch(`${API}/users/${id}/coupon-perms`, { method: 'PATCH', body: JSON.stringify(data) });
