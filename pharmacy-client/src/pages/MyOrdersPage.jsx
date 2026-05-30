import { Fragment, useEffect, useState } from 'react';
import { getMyOrders, getOrderById } from '../api/index.js';

const statusLabel = (s) => {
  switch(s) {
    case 'created': return 'Створено';
    case 'paid': return 'Оплачено';
    case 'delivered': return 'Доставлено';
    case 'delivered_unpaid': return 'Доставлено (не оплачене)';
    case 'received': return 'Отримано';
    default: return s;
  }
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getMyOrders().then(data => { if (mounted) setOrders(data || []); })
      .catch(err => { console.error('getMyOrders error', err); if (mounted) setError(err); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="page"><h1>Мої замовлення</h1><div className="loading">Завантаження...</div></div>;
  if (error) return <div className="page"><h1>Мої замовлення</h1><div className="alert alert-error">Не вдалося завантажити замовлення</div></div>;

  const toggleExpanded = async (orderId) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!detailsMap[orderId]) {
      const details = await getOrderById(orderId);
      setDetailsMap(prev => ({ ...prev, [orderId]: details }));
    }
  };

  return (
    <div className="page">
      <h1>Мої замовлення</h1>
      {orders.length === 0 ? (
        <div className="empty">У вас ще немає замовлень</div>
      ) : (
        <table className="data-table">
          <thead><tr><th>#</th><th>Сума</th><th>Статус</th><th>Дата</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <Fragment key={o.id}>
                <tr onClick={() => toggleExpanded(o.id)} style={{ cursor: 'pointer' }}>
                  <td>{o.id}</td>
                  <td>{parseFloat(o.total_amount||0).toFixed(2)}</td>
                  <td>{statusLabel(o.status)}</td>
                  <td>{o.created_at ? new Date(o.created_at).toLocaleString('uk-UA') : '-'}</td>
                </tr>
                {expandedId === o.id && (
                  <tr>
                    <td colSpan={4} style={{ background: '#fafbff' }}>
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                          <tr><th>Товар</th><th>К-сть</th><th>Ціна/шт</th><th>Сума</th></tr>
                        </thead>
                        <tbody>
                          {(detailsMap[o.id]?.items || []).map(item => {
                            const qty = Number(item.quantity || 0);
                            const price = Number(item.unit_price || 0);
                            return (
                              <tr key={item.id}>
                                <td>{item.product_name || `Товар #${item.product_id}`}</td>
                                <td>{qty}</td>
                                <td>{price.toFixed(2)} грн</td>
                                <td>{(qty * price).toFixed(2)} грн</td>
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
    </div>
  );
}
