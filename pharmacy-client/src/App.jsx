import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import Navbar         from './components/common/Navbar.jsx';
import AppErrorBoundary from './components/common/AppErrorBoundary.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import CatalogPage    from './pages/CatalogPage.jsx';
import LoginPage      from './pages/LoginPage.jsx';
import RegisterPage   from './pages/RegisterPage.jsx';
import InventoryPage  from './pages/InventoryPage.jsx';
import AdminPage      from './pages/AdminPage.jsx';
import ReportsPage    from './pages/ReportsPage.jsx';
import CheckoutPage   from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

function AppShell() {
  const { user } = useAuth();

  return (
    <CartProvider key={user?.id ?? 'guest'}>
      <BrowserRouter>
        <AppErrorBoundary>
        <div className="app-shell">
          <Navbar />
          <main className="app-main">
            <Routes>
              {/* Public */}
              <Route path="/"      element={<CatalogPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Seller + Admin */}
              <Route path="/inventory" element={
                <ProtectedRoute roles={['admin', 'seller']}>
                  <InventoryPage />
                </ProtectedRoute>
              } />

              {/* Admin only */}
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin', 'seller']}>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute roles={['admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute roles={['admin', 'seller']}><AdminOrdersPage /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute roles={['admin','seller','visitor']}><MyOrdersPage /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        </AppErrorBoundary>
      </BrowserRouter>
    </CartProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
