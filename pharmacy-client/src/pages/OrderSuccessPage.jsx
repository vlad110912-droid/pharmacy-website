import { useEffect, useState } from 'react';
import { getOrderById } from '../api/index.js';
import { useLocation } from 'react-router-dom';

function useQuery() { return new URLSearchParams(useLocation().search); }

export default function OrderSuccessPage() {
  const q = useQuery();
  const id = q.get('id');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!id) return;
    getOrderById(id).then(setOrder).catch(()=>{});
  }, [id]);

  if (!id) return <div className="page">Немає ідентифікатора замовлення</div>;

  // compute delivery date as order created_at + 2-3 days randomly
  const deliveryDate = order ? new Date(Date.parse(order.created_at) + (2 + Math.floor(Math.random()*2)) * 24*3600*1000) : null;
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

  return (
    <div className="page">
      <h1>Замовлення оформлено</h1>
      {order ? (
        <div className="order-success-card">
          <div className="order-success-head">
            <div>
              <div>Номер замовлення: <b>#{order.id}</b></div>
              <div>Статус: <b>{statusLabel(order.status)}</b></div>
              <div>Дата оформлення: {new Date(order.created_at).toLocaleString('uk-UA')}</div>
              <div>Дата доставки (орієнтовно): {deliveryDate.toLocaleDateString('uk-UA')}</div>
            </div>
            <div className="order-success-total">{parseFloat(order.total_amount).toFixed(2)} грн</div>
          </div>

          <h2>Склад замовлення</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>К-сть</th>
                <th>Ціна/шт</th>
                <th>Сума</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => {
                const unitPrice = parseFloat(item.unit_price || 0);
                const qty = parseInt(item.quantity || 0, 10);
                return (
                  <tr key={item.id}>
                    <td>{item.product_name || `Товар #${item.product_id}`}</td>
                    <td>{qty}</td>
                    <td>{unitPrice.toFixed(2)} грн</td>
                    <td>{(unitPrice * qty).toFixed(2)} грн</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div>Завантаження...</div>
      )}
    </div>
  );
}
