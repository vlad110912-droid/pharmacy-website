import { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts.js';
import { useCart } from '../context/CartContext.jsx';
import { getCategories } from '../api/index.js';

function ProductCard({ product }) {
  const isExpired  = product.expiryDate && new Date(product.expiryDate) <= new Date();
  const isCritical = !isExpired && product.expiryDate &&
    new Date(product.expiryDate) <= new Date(Date.now() + 30 * 86400000);
  const { items, addItem, updateQty } = useCart();
  const productId = Number(product.id);
  const cartItem = items.find(i => Number(i.productId) === productId);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <strong>{product.name}</strong>
      {product.categoryName && <small style={{ color: '#888' }}>{product.categoryName}</small>}
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a73e8' }}>
        {parseFloat(product.salePrice).toFixed(2)} грн
      </div>
      <div>
        Залишок: <b>{product.quantity}</b> {product.unit || ''}
      </div>
      {product.expiryDate && (
        <div className={isExpired ? 'expiry-expired' : isCritical ? 'expiry-critical' : ''}>
          Придатний до: {new Date(product.expiryDate).toLocaleDateString('uk-UA')}
          {isExpired && ' ⚠ ПРОСТРОЧЕНО'}
          {isCritical && ' ⚡ Критичний'}
        </div>
      )}
      {product.description && <p style={{ fontSize: '0.82rem', color: '#666' }}>{product.description}</p>}
      <div style={{ marginTop: 8 }}>
        {cartItem ? (
          <div className="quantity-stepper quantity-stepper--compact">
            <button
              onClick={() => updateQty(product.id, cartItem.quantity - 1)}
              className="btn btn-secondary"
              type="button"
              aria-label={`Зменшити кількість ${product.name}`}
            >
              -
            </button>
            <div className="quantity-stepper__value">{cartItem.quantity}</div>
            <button
              onClick={() => updateQty(product.id, cartItem.quantity + 1)}
              className="btn btn-secondary"
              type="button"
              aria-label={`Збільшити кількість ${product.name}`}
            >
              +
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => addItem(product, 1)}>Купити</button>
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [filterValues, setFilterValues] = useState({ name: '', categoryId: '', minPrice: '', maxPrice: '' });
  const [categories, setCategories]     = useState([]);
  const { products, loading, error, setFilters } = useProducts();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    const active = {};
    if (filterValues.name)       active.name       = filterValues.name;
    if (filterValues.categoryId) active.categoryId = filterValues.categoryId;
    if (filterValues.minPrice)   active.minPrice   = filterValues.minPrice;
    if (filterValues.maxPrice)   active.maxPrice   = filterValues.maxPrice;
    setFilters(active);
  };

  const handleReset = () => {
    setFilterValues({ name: '', categoryId: '', minPrice: '', maxPrice: '' });
    setFilters({});
  };

  return (
    <div className="page">
      <h1>Каталог препаратів</h1>

      <form className="filter-panel" onSubmit={handleFilter}>
        <input
          placeholder="Назва препарату"
          value={filterValues.name}
          onChange={e => setFilterValues(p => ({ ...p, name: e.target.value }))}
        />
        <select
          value={filterValues.categoryId}
          onChange={e => setFilterValues(p => ({ ...p, categoryId: e.target.value }))}
        >
          <option value="">Усі категорії</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          type="number" placeholder="Ціна від" min="0"
          value={filterValues.minPrice}
          onChange={e => setFilterValues(p => ({ ...p, minPrice: e.target.value }))}
          style={{ width: 110 }}
        />
        <input
          type="number" placeholder="Ціна до" min="0"
          value={filterValues.maxPrice}
          onChange={e => setFilterValues(p => ({ ...p, maxPrice: e.target.value }))}
          style={{ width: 110 }}
        />
        <button type="submit" className="btn btn-primary">Фільтрувати</button>
        <button type="button" className="btn btn-secondary" onClick={handleReset}>Скинути</button>
      </form>

      {loading && <div className="loading">Завантаження...</div>}
      {error   && <div className="alert alert-error">{error}</div>}
      {!loading && !error && products.length === 0 && (
        <div className="empty">Препарати не знайдено</div>
      )}
      {!loading && !error && (
        <div className="card-grid">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
