import { useEffect, useState } from 'react';
import { getUsers, updateUserRole, deleteUser } from '../api/index.js';

const roleLabel = (role) => {
  switch (role) {
    case 'admin': return 'адмін';
    case 'seller': return 'продавець';
    case 'visitor': return 'відвідувач';
    default: return role || '—';
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [draftRoles, setDraftRoles] = useState({});

  const load = () => getUsers().then(setUsers).catch(()=>{});
  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    await updateUserRole(id, role);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Видалити користувача?')) return;
    await deleteUser(id);
    load();
  };

  const roleOptions = [
    { value: 'admin', label: 'Адмін' },
    { value: 'seller', label: 'Продавець' },
    { value: 'visitor', label: 'Відвідувач' },
  ];

  return (
    <div className="page">
      <h1>Користувачі</h1>
      <table className="data-table">
        <thead><tr><th>Логін</th><th>Роль</th><th>Створено</th><th>Дії</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.login}</td>
              <td>{roleLabel(u.role)}</td>
              <td>{new Date(u.created_at).toLocaleString('uk-UA')}</td>
              <td>
                <div className="user-actions">
                  <div className="user-actions__row">
                    <select
                      className="form-control"
                      style={{ minWidth: 170, padding: '0.8rem 0.95rem' }}
                      value={draftRoles[u.id] || u.role}
                      onChange={(e) => setDraftRoles(prev => ({ ...prev, [u.id]: e.target.value }))}
                    >
                      {roleOptions.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary" onClick={() => changeRole(u.id, draftRoles[u.id] || u.role)}>Зберегти роль</button>
                    <button className="btn btn-danger" onClick={() => remove(u.id)}>Видалити</button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
