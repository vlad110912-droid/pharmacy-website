import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { createOrder } from '../api/index.js';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const { items, totalAmount, clear } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [city, setCity] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const navigate = useNavigate();
  const deliveryLabel = deliveryType === 'pickup' ? 'Самовивіз' : 'Доставка поштою';
  const paymentLabel = paymentMethod === 'cash' ? 'При отриманні' : 'Онлайн';

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatCardExp = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length < 3) return digits;
    return `${digits.slice(0,2)}/${digits.slice(2)}`;
  };

  const formatCardCvc = (value) => value.replace(/\D/g, '').slice(0, 3);

  const handleConfirm = async () => {
    if (!customerName || !phone) return alert('Вкажіть ПІБ та телефон');
    setProcessing(true);
    try {
      if (paymentMethod === 'online') {
        // show card form if not yet
        if (!showCardForm) {
          setShowCardForm(true);
          setProcessing(false);
          return;
        }
        // basic client-side validation of card fields
        if (!cardNumber || !cardName || !cardExp || !cardCvc) {
          alert('Введіть дані картки (псевдо)');
          setProcessing(false);
          return;
        }
        // pseudo payment delay
        await new Promise(r=>setTimeout(r,1200));
      }
      const order = await createOrder({
        customerName, phone, deliveryType, city, pickupPoint, paymentMethod, items: items.map(i=>({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice }))
      });
      // ensure cart cleared locally even if something odd happens
      clear();
      navigate(`/order-success?id=${order.id}`);
    } catch (e) {
      console.error(e);
      alert('Помилка при оформленні замовлення');
      setProcessing(false);
    }
  };

  return (
    <div className="page">
      <h1>Оформлення замовлення</h1>
      <div className="checkout-grid">
        <div className="checkout-card checkout-form">
          <h2>Дані покупця</h2>
          <div className="form-group">
            <label>ПІБ покупця</label>
            <input value={customerName} onChange={e=>setCustomerName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Номер телефону</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Доставка</label>
            <div className="segmented-control">
              <label className="segmented-control__option">
                <input type="radio" checked={deliveryType==='pickup'} onChange={()=>setDeliveryType('pickup')} />
                <span className="segmented-control__label">Самовивіз</span>
              </label>
              <label className="segmented-control__option">
                <input type="radio" checked={deliveryType==='delivery'} onChange={()=>setDeliveryType('delivery')} />
                <span className="segmented-control__label">Доставка поштою</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Місто</label>
            <input placeholder="Місто" value={city} onChange={e=>setCity(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Номер відділення</label>
            <input placeholder="Відділення" value={pickupPoint} onChange={e=>setPickupPoint(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Оплата</label>
            <div className="segmented-control">
              <label className="segmented-control__option">
                <input type="radio" checked={paymentMethod==='online'} onChange={()=>setPaymentMethod('online')} />
                <span className="segmented-control__label">Онлайн</span>
              </label>
              <label className="segmented-control__option">
                <input type="radio" checked={paymentMethod==='cash'} onChange={()=>setPaymentMethod('cash')} />
                <span className="segmented-control__label">При отриманні</span>
              </label>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={handleConfirm} disabled={processing} className="btn btn-primary">Підтверджую</button>
            <button onClick={() => window.history.back()} className="btn btn-secondary" style={{ marginLeft: 8 }}>Відмінити</button>
          </div>
        </div>

        <div className="checkout-card order-summary">
          <h2>Підсумок</h2>
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            <div><b>Доставка:</b> {deliveryLabel}</div>
            <div><b>Оплата:</b> {paymentLabel}</div>
          </div>
          <div>
            {items.map(it=> (
              <div key={it.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <div>{it.name} x{it.quantity}</div>
                <div>{(it.unitPrice * it.quantity).toFixed(2)} грн</div>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Всього: {totalAmount.toFixed(2)} грн</div>
          {paymentMethod === 'online' && showCardForm && (
            <div style={{ marginTop: 12 }}>
              <h3>Псевдо-оплата карткою</h3>
              <div className="form-group"><label>Номер картки</label><input value={cardNumber} onChange={e=>setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242"/></div>
              <div className="form-group"><label>Ім'я на картці</label><input value={cardName} onChange={e=>setCardName(e.target.value.toUpperCase())} placeholder="IVAN IVANENKO"/></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="form-group" style={{ flex: 1 }}><label>MM/YY</label><input value={cardExp} onChange={e=>setCardExp(formatCardExp(e.target.value))} placeholder="12/26"/></div>
                <div className="form-group" style={{ width: 120 }}><label>CVC</label><input value={cardCvc} onChange={e=>setCardCvc(formatCardCvc(e.target.value))} placeholder="123"/></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
