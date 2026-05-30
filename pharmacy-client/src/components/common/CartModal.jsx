import React from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function CartModal({ onClose }) {
  const { items, updateQty, removeItem, totalAmount } = useCart();
  const navigate = useNavigate();
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Кошик</h3>
          <button className="icon-button" onClick={onClose} aria-label="Закрити кошик">✕</button>
        </div>
        {safeItems.length === 0 && <div className="empty empty--soft">Кошик порожній</div>}
        <div className="cart-list">
          {safeItems.map(it => {
            const unitPrice = Number(it.unitPrice || 0);
            const qty = Number(it.quantity || 0);
            return (
              <div key={it.productId} className="cart-row">
                <div className="cart-row__name">{it.name}</div>
                <div className="cart-row__unit">{unitPrice.toFixed(2)} грн</div>
                <div className="quantity-stepper">
                  <button onClick={() => updateQty(it.productId, qty - 1)} className="btn btn-secondary" type="button">-</button>
                  <div className="quantity-stepper__value">{qty}</div>
                  <button onClick={() => updateQty(it.productId, qty + 1)} className="btn btn-secondary" type="button">+</button>
                </div>
                <div className="cart-row__total">{(qty * unitPrice).toFixed(2)} грн</div>
                <div><button className="btn btn-danger" onClick={() => removeItem(it.productId)} type="button">Видалити</button></div>
              </div>
            )})}
        </div>
        <div className="cart-summary">Разом: {Number(totalAmount || 0).toFixed(2)} грн</div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => { onClose(); navigate('/checkout'); }}>Оформити замовлення</button>
          <button className="btn btn-secondary" onClick={onClose}>Продовжити покупки</button>
        </div>
      </div>
    </div>
  );
}
