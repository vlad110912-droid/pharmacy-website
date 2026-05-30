// src/components/common/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useState, useEffect } from 'react';
import CartModal from './CartModal.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useLocation } from 'react-router-dom';

const roleLabel = (role) => {
  switch (role) {
    case 'admin': return 'адмін';
    case 'seller': return 'продавець';
    case 'visitor': return 'відвідувач';
    default: return role || '—';
  }
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [openCart, setOpenCart] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // close cart when route changes
    setOpenCart(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar__brand-group">
        <span className="brand">Аптека</span>
        <span className="brand-badge">PRO</span>
      </div>

      <div className="navbar__links">
        <Link to="/">Каталог</Link>
        {user && user.role !== 'visitor' && <Link to="/inventory">Запаси</Link>}
        {user && user.role !== 'visitor' && (
          <>
            <Link to="/admin">Товари</Link>
            <Link to="/admin/orders">Замовлення</Link>
            {user.role === 'admin' && <Link to="/reports">Звіти</Link>}
            {user.role === 'admin' && <Link to="/admin/users">Користувачі</Link>}
          </>
        )}
      </div>

      <div className="navbar__actions">
        {user && <Link to="/my-orders" className="navbar__text-link">Мої замовлення</Link>}
        <button className="btn btn-navbar btn-navbar--ghost" onClick={() => setOpenCart(true)}>Кошик <span className="btn-navbar__count">{totalCount}</span></button>
        {user ? (
          <>
            <span className="user-info">{user.login}</span>
            <span className="user-role">{roleLabel(user.role)}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>Вийти</button>
          </>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="btn btn-navbar">Увійти</Link>
            <Link to="/register" className="btn btn-navbar">Реєстрація</Link>
          </div>
        )}
      </div>
      {openCart && <CartModal onClose={() => setOpenCart(false)} />}
    </nav>
  );
}
