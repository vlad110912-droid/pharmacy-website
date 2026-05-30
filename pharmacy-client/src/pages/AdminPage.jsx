import { useState, useEffect, useCallback } from 'react';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, getClasses, getExpiringProducts, writeOffExpired,
  getSuppliers, createSupplier, deleteSupplier,
  createSupply,
} from '../api/index.js';

// ── Product Form Modal ────────────────────────────────────────────────────────
function ProductModal({ product, categories, classes, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    categoryId: product?.categoryId || '',
    classId: product?.classId || '',
    unit: product?.unit || 'шт',
    packagingUnit: product?.packagingUnit || '',
    purchasePrice: product?.purchasePrice || '',
    salePrice: product?.salePrice || '',
    expiryDate: product?.expiryDate
      ? new Date(product.expiryDate).toISOString().split('T')[0]
      : '',
    quantity: product?.quantity ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const buildPayload = () => ({
    ...form,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    classId: form.classId ? Number(form.classId) : null,
    purchasePrice: form.purchasePrice === '' ? 0 : Number(form.purchasePrice),
    salePrice: form.salePrice === '' ? 0 : Number(form.salePrice),
    quantity: form.quantity === '' ? 0 : Number(form.quantity),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = buildPayload();
      if (product?.id) await updateProduct(product.id, payload);
      else             await createProduct(payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{product ? 'Редагувати препарат' : 'Новий препарат'}</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Назва *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="form-group">
              <label>Категорія</label>
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                <option value="">— Без категорії —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Клас</label>
              <select value={form.classId} onChange={e => set('classId', e.target.value)}>
                <option value="">— Без класу —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Ціна закупівлі *</label>
              <input type="number" min="0" step="0.01" value={form.purchasePrice}
                onChange={e => set('purchasePrice', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Ціна продажу *</label>
              <input type="number" min="0" step="0.01" value={form.salePrice}
                onChange={e => set('salePrice', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Одиниця виміру</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Тара</label>
              <input value={form.packagingUnit} onChange={e => set('packagingUnit', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Термін придатності *</label>
              <input type="date" value={form.expiryDate}
                onChange={e => set('expiryDate', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Початковий залишок</label>
              <input type="number" min="0" value={form.quantity}
                onChange={e => set('quantity', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Опис</label>
            <textarea rows={2} value={form.description}
              onChange={e => set('description', e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Supply Form Modal ─────────────────────────────────────────────────────────
function SupplyModal({ suppliers, products, onSave, onClose }) {
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems]           = useState([{ productId: '', quantity: 1, purchasePrice: '', salePrice: '', expiryDate: '' }]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const addItem    = () => setItems(p => [...p, { productId: '', quantity: 1, purchasePrice: '', salePrice: '', expiryDate: '' }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) =>
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createSupply({
        supplierId: parseInt(supplierId),
        items: items.map(it => ({
          productId: parseInt(it.productId),
          quantity: parseInt(it.quantity),
          purchasePrice: parseFloat(it.purchasePrice) || 0,
          salePrice: parseFloat(it.salePrice) || 0,
          expiryDate: it.expiryDate,
        })),
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 700 }}>
        <h3>Нова поставка</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Постачальник *</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
              <option value="">Оберіть...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <h4 style={{ marginBottom: '0.5rem' }}>Позиції</h4>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 90px 90px 120px 30px', gap: '0.35rem', marginBottom: '0.35rem', alignItems: 'end' }}>
              <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                <option value="">Препарат</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min="1" placeholder="Кіл." value={item.quantity}
                onChange={e => updateItem(i, 'quantity', e.target.value)} required />
              <input type="number" min="0" step="0.01" placeholder="Закуп." value={item.purchasePrice}
                onChange={e => updateItem(i, 'purchasePrice', e.target.value)} />
              <input type="number" min="0" step="0.01" placeholder="Прод." value={item.salePrice}
                onChange={e => updateItem(i, 'salePrice', e.target.value)} />
              <input type="date" value={item.expiryDate}
                onChange={e => updateItem(i, 'expiryDate', e.target.value)} required />
              {items.length > 1 &&
                <button type="button" className="btn btn-danger" onClick={() => removeItem(i)}>✕</button>}
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addItem}>+ Позиція</button>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? '...' : 'Зберегти поставку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab]               = useState('products');
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [classes, setClasses]       = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [expiring, setExpiring]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalProduct, setModalProduct] = useState(null);   // null = closed, {} = new, obj = edit
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [message, setMessage]       = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, cl, s, ex] = await Promise.all([
        getProducts(), getCategories(), getClasses(), getSuppliers(), getExpiringProducts(30),
      ]);
      setProducts(p); setCategories(c); setClasses(cl); setSuppliers(s); setExpiring(ex);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDelete = async (id) => {
    if (!confirm('Видалити препарат?')) return;
    await deleteProduct(id);
    await loadAll();
  };

  const handleWriteOffExpired = async () => {
    if (!confirm('Списати всі прострочені товари?')) return;
    const result = await writeOffExpired();
    setMessage(`Списано ${result.totalItems} позицій`);
    await loadAll();
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    setCategorySaving(true);
    try {
      await createCategory({ name: categoryName.trim() });
      setCategoryName('');
      setMessage('Категорію додано');
      await loadAll();
    } catch (err) {
      setCategoryError(err.response?.data?.error || 'Помилка створення категорії');
    } finally {
      setCategorySaving(false);
    }
  };

  const tabs = {
    products: 'Препарати',
    categories: 'Категорії',
    supplies: 'Поставки',
    expiring: 'Критичний термін',
  };

  return (
    <div className="page">
      <h1>Адміністрування</h1>

      {message && <div className="alert alert-success">{message} <button onClick={() => setMessage('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {Object.entries(tabs).map(([k, v]) => (
          <button key={k} className={`btn ${tab === k ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(k)}>{v}</button>
        ))}
        {tab === 'products' && (
          <button className="btn btn-success" style={{ marginLeft: 'auto' }}
            onClick={() => setModalProduct({})}>+ Новий препарат</button>
        )}
        {tab === 'supplies' && (
          <button className="btn btn-success" style={{ marginLeft: 'auto' }}
            onClick={() => setShowSupplyModal(true)}>+ Нова поставка</button>
        )}
        {tab === 'expiring' && (
          <button className="btn btn-danger" style={{ marginLeft: 'auto' }}
            onClick={handleWriteOffExpired}>⚠ Списати прострочені</button>
        )}
      </div>

      {loading && <div className="loading">Завантаження...</div>}

      {/* Categories tab */}
      {!loading && tab === 'categories' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <form className="card" onSubmit={handleCreateCategory} style={{ display: 'grid', gap: '0.75rem', maxWidth: 520 }}>
            <h2 style={{ margin: 0 }}>Нова категорія</h2>
            {categoryError && <div className="alert alert-error" style={{ marginBottom: 0 }}>{categoryError}</div>}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Назва категорії</label>
              <input
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                placeholder="Наприклад: Заспокійливі"
                required
              />
            </div>
            <button type="submit" className="btn btn-success" disabled={categorySaving || !categoryName.trim()}>
              {categorySaving ? 'Збереження...' : 'Додати категорію'}
            </button>
          </form>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Існуючі категорії</h2>
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Назва</th></tr>
              </thead>
              <tbody>
                {categories.length === 0 && <tr><td colSpan="2" className="empty">Категорії відсутні</td></tr>}
                {categories.map(category => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products tab */}
      {!loading && tab === 'products' && (
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Назва</th><th>Категорія</th><th>Ціна</th><th>Залишок</th><th>Придатний до</th><th>Дії</th></tr>
          </thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan="7" className="empty">Препарати відсутні</td></tr>}
            {products.map(p => {
              const exp = p.expiryDate ? new Date(p.expiryDate) : null;
              const isExpired  = exp && exp <= new Date();
              const isCritical = !isExpired && exp && exp <= new Date(Date.now() + 30*86400000);
              return (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.categoryName || '—'}</td>
                  <td>{parseFloat(p.salePrice).toFixed(2)} грн</td>
                  <td>{p.quantity} {p.unit || ''}</td>
                  <td className={isExpired ? 'expiry-expired' : isCritical ? 'expiry-critical' : ''}>
                    {exp ? exp.toLocaleDateString('uk-UA') : '—'}
                    {isExpired && ' ⚠'}
                  </td>
                  <td style={{ display: 'flex', gap: '0.3rem' }}>
                    <button className="btn btn-secondary" onClick={() => setModalProduct(p)}>✎</button>
                    <button className="btn btn-danger"    onClick={() => handleDelete(p.id)}>🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Expiring tab */}
      {!loading && tab === 'expiring' && (
        <>
          <p style={{ marginBottom: '0.75rem', color: '#666' }}>
            Препарати з терміном придатності ≤ 30 днів, впорядковані за класом та датою.
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Назва</th><th>Клас</th><th>Залишок</th><th>Придатний до</th><th>Днів залишилось</th></tr>
            </thead>
            <tbody>
              {expiring.length === 0 && <tr><td colSpan="5" className="empty">Критичних позицій немає</td></tr>}
              {expiring.map(p => {
                const exp = new Date(p.expiryDate);
                const days = Math.ceil((exp - new Date()) / 86400000);
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.className || '—'}</td>
                    <td>{p.quantity} {p.unit || ''}</td>
                    <td className="expiry-critical">{exp.toLocaleDateString('uk-UA')}</td>
                    <td><span className={`badge ${days <= 7 ? 'badge-red' : 'badge-orange'}`}>{days} дн.</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Suppliers tab removed per UX request */}

      {/* Supplies tab */}
      {!loading && tab === 'supplies' && (
        <div className="alert alert-info">
          Для перегляду деталей поставок відкрийте розділ «Запаси» або скористайтесь API <code>GET /api/supplies</code>.
        </div>
      )}

      {/* Modals */}
      {modalProduct !== null && (
        <ProductModal
          product={modalProduct?.id ? modalProduct : null}
          categories={categories}
          classes={classes}
          onSave={async () => { setModalProduct(null); await loadAll(); }}
          onClose={() => setModalProduct(null)}
        />
      )}
      {showSupplyModal && (
        <SupplyModal
          suppliers={suppliers}
          products={products}
          onSave={async () => { setShowSupplyModal(false); await loadAll(); }}
          onClose={() => setShowSupplyModal(false)}
        />
      )}
    </div>
  );
}
