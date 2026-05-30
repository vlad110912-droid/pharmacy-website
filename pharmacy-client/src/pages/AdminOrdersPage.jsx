import { Fragment, useEffect, useState } from 'react';
import { getOrders, updateOrderStatus, getOrderById } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';

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

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const data = await getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
      setOrders([]);
      setError('Не вдалося завантажити список замовлень.');
    }
  };
  useEffect(() => { load(); }, []);

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

  const notifyDelivery = async (order) => {
    let nextStatus = 'delivered';
    if (order.payment_method === 'cash' || order.payment_method === 'при отриманні' || order.payment_method === 'cash_on_delivery') {
      nextStatus = 'delivered_unpaid';
    }
    await updateOrderStatus(order.id, nextStatus);
    load();
  };

  const notifyReceived = async (order) => {
    await updateOrderStatus(order.id, 'received');
    load();
  };

  return (
    <div className="page">
      <h1>Замовлення</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <table className="data-table">
        <thead><tr><th>#</th><th>Клієнт</th><th>Сума</th><th>Оплата</th><th>Статус</th><th>Дата</th><th>Дії</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <Fragment key={o.id}>
              <tr onClick={() => toggleExpanded(o.id)} style={{ cursor: 'pointer' }}>
                <td>{o.id}</td>
                <td>{o.customer_name} / {o.phone}</td>
                <td>{parseFloat(o.total_amount).toFixed(2)}</td>
                <td>{o.payment_method}</td>
                <td>{statusLabel(o.status)}</td>
                <td>{new Date(o.created_at).toLocaleString('uk-UA')}</td>
                <td onClick={e => e.stopPropagation()}>
                  {(o.status !== 'delivered' && o.status !== 'delivered_unpaid' && o.status !== 'received') && (
                    <button className="btn" onClick={() => notifyDelivery(o)}>Повідомити про доставку</button>
                  )}
                  {o.status === 'delivered_unpaid' && (
                    <button className="btn btn-success" onClick={() => notifyReceived(o)}>Повідомити про отримання</button>
                  )}
                </td>
              </tr>
              {expandedId === o.id && (
                <tr>
                  <td colSpan={7} style={{ background: '#fafbff' }}>
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
    </div>
  );
}
