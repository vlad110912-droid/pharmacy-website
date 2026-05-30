import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [creds, setCreds]   = useState({ login: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login }           = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const successMessage      = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(creds);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/inventory' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка авторизації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2>💊 Вхід в систему</h2>
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логін</label>
            <input
              value={creds.login}
              onChange={e => setCreds(p => ({ ...p, login: e.target.value }))}
              required autoFocus
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={creds.password}
              onChange={e => setCreds(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>Немає акаунта? </span>
          <Link to="/register">Зареєструватися</Link>
        </div>
      </div>
    </div>
  );
}
