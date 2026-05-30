import { useState } from 'react';
import { getSummaryReport } from '../api/index.js';

function ReportTable({ data }) {
  if (!data || data.length === 0)
    return <div className="empty">Дані за обраний період відсутні</div>;

  const totalIncome   = data.reduce((s, r) => s + parseFloat(r.income), 0);
  const totalRevenue  = data.reduce((s, r) => s + parseFloat(r.revenue), 0);
  const totalCost     = data.reduce((s, r) => s + parseFloat(r.cost), 0);

  return (
    <div>
      {/* Summary cards */}
      <div className="card-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Виручка',         value: `${totalRevenue.toFixed(2)} грн`, color: '#1a73e8' },
          { label: 'Собівартість',    value: `${totalCost.toFixed(2)} грн`,    color: '#ef6c00' },
          { label: 'Дохід',           value: `${totalIncome.toFixed(2)} грн`,  color: '#43a047' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color || '#333' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Detailed table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Клас ліків</th>
            <th>Виручка (грн)</th>
            <th>Собівартість (грн)</th>
            <th>Дохід (грн)</th>
            <th>% від доходу</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.classId}>
              <td><b>{row.className}</b></td>
              <td>{parseFloat(row.revenue).toFixed(2)}</td>
              <td>{parseFloat(row.cost).toFixed(2)}</td>
              <td><b style={{ color: parseFloat(row.income) > 0 ? '#43a047' : '#e53935' }}>
                {parseFloat(row.income).toFixed(2)}
              </b></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    background: '#1a73e8',
                    height: 8,
                    width: `${Math.min(parseFloat(row.incomePercent), 100)}%`,
                    maxWidth: 100,
                    borderRadius: 4,
                  }} />
                  <span>{row.incomePercent}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: '#f0f4ff' }}>
            <td>РАЗОМ</td>
            <td>{totalRevenue.toFixed(2)}</td>
            <td>{totalCost.toFixed(2)}</td>
            <td>{totalIncome.toFixed(2)}</td>
            <td>100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const today   = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo,   setDateTo]   = useState(today);
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      setError('Оберіть діапазон дат');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await getSummaryReport({ dateFrom, dateTo });
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка формування звіту');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <h1>Звітність</h1>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Дата від</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Дата до</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Формування...' : 'Сформувати звіт'}
          </button>
        </div>
      </div>

      {error  && <div className="alert alert-error">{error}</div>}
      {report && (
        <>
          <h2 style={{ marginBottom: '0.75rem' }}>
            Звіт за {new Date(dateFrom).toLocaleDateString('uk-UA')} — {new Date(dateTo).toLocaleDateString('uk-UA')}
          </h2>
          <ReportTable data={report} />
        </>
      )}
      {!report && !loading && (
        <div className="empty">Оберіть діапазон дат та натисніть «Сформувати звіт»</div>
      )}
    </div>
  );
}
