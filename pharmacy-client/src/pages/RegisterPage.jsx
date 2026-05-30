import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/index.js';

function getPasswordStrength(password) {
  if (!password) return { label: '', score: 0, className: '' };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-zа-я]/i.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^\w\s]/.test(password)) score += 1;

  if (score <= 2) return { label: 'Слабкий', score: 1, className: 'strength-weak' };
  if (score <= 4) return { label: 'Середній', score: 2, className: 'strength-medium' };
  return { label: 'Сильний', score: 3, className: 'strength-strong' };
}

export default function RegisterPage() {
  const [creds, setCreds] = useState({ login: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginValid = useMemo(() => /^[A-Za-z0-9]+$/.test(creds.login), [creds.login]);
  const passwordValid = useMemo(() => /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(creds.password), [creds.password]);
  const passwordsMatch = useMemo(
    () => !creds.confirmPassword || creds.password === creds.confirmPassword,
    [creds.password, creds.confirmPassword]
  );
  const passwordStrength = useMemo(() => getPasswordStrength(creds.password), [creds.password]);
  const canSubmit = loginValid && passwordValid && creds.password === creds.confirmPassword && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginValid) {
      setError('Логін може містити лише латинські літери та цифри');
      return;
    }

    if (!passwordValid) {
      setError('Пароль має бути не менш як 6 символів та містити хоча б одну букву і одну цифру');
      return;
    }

    if (creds.password !== creds.confirmPassword) {
      setError('Паролі не збігаються');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ login: creds.login, password: creds.password });
      navigate('/login', { state: { message: 'Реєстрація успішна. Тепер увійдіть у систему.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2>📝 Реєстрація</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логін</label>
            <input
              type="text"
              value={creds.login}
              onChange={e => setCreds(p => ({ ...p, login: e.target.value }))}
              required
              autoFocus
              pattern="[A-Za-z0-9]+"
              title="Логін може містити лише латинські літери та цифри"
            />
            <small className={`field-hint ${creds.login && !loginValid ? 'field-hint-error' : ''}`}>
              Лише латинські літери та цифри.
            </small>
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={creds.password}
              onChange={e => setCreds(p => ({ ...p, password: e.target.value }))}
              required
              minLength={6}
              pattern="^(?=.*[A-Za-z])(?=.*\d).{6,}$"
              title="Пароль має бути не менш як 6 символів та містити хоча б одну букву і одну цифру"
            />
            <small className={`field-hint ${creds.password && !passwordValid ? 'field-hint-error' : ''}`}>
              Мінімум 6 символів, хоча б одна буква і одна цифра.
            </small>
            <div className="password-strength" aria-live="polite">
              <div className="password-strength__bar">
                <span className={`password-strength__fill ${passwordStrength.className}`} data-score={passwordStrength.score}></span>
              </div>
              <small className="field-hint">
                Складність: <b>{passwordStrength.label || 'ще не оцінено'}</b>
              </small>
            </div>
          </div>
          <div className="form-group">
            <label>Підтвердження пароля</label>
            <input
              type="password"
              value={creds.confirmPassword}
              onChange={e => setCreds(p => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
            <small className={`field-hint ${creds.confirmPassword && !passwordsMatch ? 'field-hint-error' : ''}`}>
              {creds.confirmPassword && !passwordsMatch ? 'Паролі не збігаються' : 'Повторіть пароль для перевірки.'}
            </small>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!canSubmit}>
            {loading ? 'Реєстрація...' : 'Створити акаунт'}
          </button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>Вже маєте акаунт? </span>
          <Link to="/login">Увійти</Link>
        </div>
      </div>
    </div>
  );
}