import { Fragment, useState, useEffect } from 'react';
import { getProducts, getSales, registerSale, getOrders, getSaleById, getOrderById } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';

function SaleForm({ products, onSuccess, onClose }) {
  const { user }  = useAuth();
  const [items, setItems]     = useState([{ productId: '', quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const addItem    = () => setItems(p => [...p, { productId: '', quantity: 1 }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) =>
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerSale({
        items: items.map(it => ({ productId: parseInt(it.productId), quantity: parseInt(it.quantity) })),
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Реєстрація продажу</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <select
                value={item.productId}
                onChange={e => updateItem(i, 'productId', e.target.value)}
                required style={{ flex: 2 }}
              >
                <option value="">Оберіть препарат</option>
                {products.filter(p => p.quantity > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {parseFloat(p.salePrice).toFixed(2)} грн (є: {p.quantity})
                  </option>
                ))}
              </select>
              <input
                type="number" min="1" value={item.quantity}
                onChange={e => updateItem(i, 'quantity', e.target.value)}
                required style={{ width: 70 }}
              />
              {items.length > 1 && (
                <button type="button" className="btn btn-danger" onClick={() => removeItem(i)}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addItem}>+ Позиція</button>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Збереження...' : 'Зафіксувати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [sales, setSales]       = useState([]);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [tab, setTab]           = useState(() => (user?.role === 'seller' ? 'sales' : 'sales'));
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (user?.role === 'seller') {
      setTab('sales');
    }
  }, [user?.role]);

  const stockByProductId = products.reduce((acc, p) => {
    acc[Number(p.id)] = Number(p.quantity || 0);
    return acc;
  }, {});

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, salesRes, ordersRes] = await Promise.allSettled([
        getProducts(),
        getSales(),
        user?.role === 'visitor' ? Promise.resolve([]) : getOrders()
      ]);

      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value);
      } else {
        console.error('Failed to load products', productsRes.reason);
        setProducts([]);
        setError('Не вдалося завантажити список препаратів.');
      }

      const salesData = salesRes.status === 'fulfilled' ? (salesRes.value || []) : [];
      if (salesRes.status === 'rejected') {
        console.error('Failed to load sales', salesRes.reason);
        setError(prev => prev || 'Не вдалося завантажити журнал продажів.');
      }
      const ordersData = ordersRes.status === 'fulfilled' ? (ordersRes.value || []) : [];

      // Show checkout-created orders in sales list so sellers and admins can see site sales.
      const orderAsSales = ordersData.map(o => ({
        id: `order-${o.id}`,
        sale_date: o.created_at,
        seller_login: 'online-order',
        total_amount: o.total_amount,
        _kind: 'order',
        _orderId: o.id,
      }));

      const merged = [...salesData.map(s => ({ ...s, _kind: 'sale' })), ...orderAsSales]
        .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));

      setSales(merged);

      if (salesRes.status === 'rejected') {
        setError('Не вдалося завантажити журнал продажів.');
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const toggleExpandedSale = async (sale) => {
    if (expandedSaleId === sale.id) {
      setExpandedSaleId(null);
      return;
    }
    setExpandedSaleId(sale.id);
    if (detailsMap[sale.id]) return;

    try {
      const details = sale._kind === 'order'
        ? await getOrderById(sale._orderId)
        : await getSaleById(sale.id);
      setDetailsMap(prev => ({ ...prev, [sale.id]: details }));
    } catch (e) {
      setDetailsMap(prev => ({ ...prev, [sale.id]: { items: [] } }));
    }
  };

  const tabs = { sales: 'Продажі', products: 'Залишки' };

  return (
    <div className="page">
      <h1>Управління запасами</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {Object.entries(tabs).map(([k, v]) => (
          <button key={k} className={`btn ${tab === k ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(k)}>{v}</button>
        ))}
        <button className="btn btn-success" style={{ marginLeft: 'auto' }}
          onClick={() => setShowSaleForm(true)}>
          + Новий продаж
        </button>
      </div>

      <div className="subtitle" style={{ marginBottom: '1rem' }}>
        {tab === 'sales' ? 'Журнал продажів і продажі з інтернет-замовлень.' : 'Поточні залишки на складі.'}
      </div>

      {loading && <div className="loading">Завантаження...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && tab === 'sales' && (
        <table className="data-table">
          <thead><tr><th>№</th><th>Дата</th><th>Джерело</th><th>Продавець</th><th>Сума</th></tr></thead>
          <tbody>
            {sales.length === 0 && <tr><td colSpan="5" className="empty">Продажів немає</td></tr>}
            {sales.map(s => (
              <Fragment key={s.id}>
                <tr onClick={() => toggleExpandedSale(s)} style={{ cursor: 'pointer' }}>
                  <td>{s.id}</td>
                  <td>{new Date(s.sale_date).toLocaleString('uk-UA')}</td>
                  <td>{s._kind === 'order' ? 'Замовлення сайту' : 'Каса'}</td>
                  <td>{s.seller_login || '—'}</td>
                  <td><b>{parseFloat(s.total_amount).toFixed(2)} грн</b></td>
                </tr>
                {expandedSaleId === s.id && (
                  <tr>
                    <td colSpan={5} style={{ background: '#fafbff' }}>
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>Товар</th>
                            <th>Купили, шт</th>
                            <th>Ціна/шт</th>
                            <th>Сума</th>
                            <th>Залишок на складі</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detailsMap[s.id]?.items || []).map(item => {
                            const productId = Number(item.product_id);
                            const qty = Number(item.quantity || 0);
                            const unitPrice = Number(item.sale_price ?? item.unit_price ?? 0);
                            const stockLeft = stockByProductId[productId];
                            return (
                              <tr key={item.id}>
                                <td>{item.product_name || `Товар #${productId}`}</td>
                                <td>{qty}</td>
                                <td>{unitPrice.toFixed(2)} грн</td>
                                <td>{(qty * unitPrice).toFixed(2)} грн</td>
                                <td>{Number.isFinite(stockLeft) ? stockLeft : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      {!loading && tab === 'products' && (
        <table className="data-table">
          <thead><tr><th>Назва</th><th>Категорія</th><th>Ціна продажу</th><th>Залишок</th><th>Придатний до</th></tr></thead>
          <tbody>
            {products.map(p => {
              const exp = p.expiryDate ? new Date(p.expiryDate) : null;
              const isExpired  = exp && exp <= new Date();
              const isCritical = !isExpired && exp && exp <= new Date(Date.now() + 30*86400000);
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.categoryName || '—'}</td>
                  <td>{parseFloat(p.salePrice).toFixed(2)} грн</td>
                  <td><b>{p.quantity}</b> {p.unit || ''}</td>
                  <td className={isExpired ? 'expiry-expired' : isCritical ? 'expiry-critical' : ''}>
                    {exp ? exp.toLocaleDateString('uk-UA') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showSaleForm && (
        <SaleForm
          products={products}
          onSuccess={() => { setShowSaleForm(false); loadData(); }}
          onClose={() => setShowSaleForm(false)}
        />
      )}
    </div>
  );
}
