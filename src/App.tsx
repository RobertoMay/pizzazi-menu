import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BranchRedirect from './pages/BranchRedirect';
import MenuPage from './pages/MenuPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ProductsPage from './pages/admin/ProductsPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import UsersPage from './pages/admin/UsersPage';
import BranchesPage from './pages/admin/BranchesPage';
import QRPage from './pages/admin/QRPage';
import CustomersPage from './pages/admin/CustomersPage';
import CouponsPage from './pages/admin/CouponsPage';
import ScannerPage from './pages/admin/ScannerPage';
import CouponPublicPage from './pages/CouponPublicPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="menu-bg min-h-screen flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Cargando...</p>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/admin" replace />;
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="menu-bg min-h-screen flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Cargando...</p>
    </div>
  );
  return user ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        richColors
        toastOptions={{ style: { fontFamily: 'system-ui, sans-serif' } }}
      />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<BranchRedirect />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/admin/promotions" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/admin/branches" element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />
          <Route path="/admin/qr" element={<ProtectedRoute><QRPage /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute><CouponsPage /></ProtectedRoute>} />
          <Route path="/admin/coupons/new" element={<ProtectedRoute><CouponsPage /></ProtectedRoute>} />
          <Route path="/admin/scanner" element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
          <Route path="/c/:code" element={<CouponPublicPage />} />
          <Route path="/:slug" element={<MenuPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
