import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const storageKey = user?.id ? `cart:${user.id}` : 'cart:guest';
  const [items, setItems] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey)||'[]');
      // normalize stored items
      return raw.map(i => ({
        productId: Number(i.productId ?? i.id),
        name: i.name || i.title || 'Товар',
        unitPrice: parseFloat(i.unitPrice ?? i.price ?? i.salePrice ?? 0),
        quantity: Number(i.quantity ?? i.qty ?? 1)
      })).filter(i => i.productId && i.quantity > 0);
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch (e) {}
    // debug
    if (typeof window !== 'undefined' && window.console && window.console.debug) {
      console.debug('[Cart] items changed', items);
    }
  }, [items, storageKey]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setItems(raw.map(i => ({
        productId: Number(i.productId ?? i.id),
        name: i.name || i.title || 'Товар',
        unitPrice: parseFloat(i.unitPrice ?? i.price ?? i.salePrice ?? 0),
        quantity: Number(i.quantity ?? i.qty ?? 1)
      })).filter(i => i.productId && i.quantity > 0));
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  const addItem = (product, qty = 1) => {
    const pid = Number(product.id);
    const price = parseFloat(product.salePrice || product.unitPrice || 0);
    setItems(prev => {
      const found = prev.find(i => Number(i.productId) === pid);
      if (found) return prev.map(i => Number(i.productId) === pid ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { productId: pid, name: product.name, unitPrice: price, quantity: qty }];
    });
  };

  const updateQty = (productId, quantity) => {
    const pid = Number(productId);
    setItems(prev => prev.map(i => Number(i.productId) === pid ? { ...i, quantity: Math.max(0, Number(quantity)) } : i).filter(i => i.quantity>0));
  };

  const removeItem = (productId) => {
    const pid = Number(productId);
    setItems(prev => prev.filter(i=>Number(i.productId)!==pid));
  };
  const clear = () => setItems([]);

  const totalCount = items.reduce((s,i)=>s + Number(i.quantity || 0),0);
  const totalAmount = items.reduce((s,i)=>s + Number(i.quantity || 0) * Number(i.unitPrice || 0),0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, totalCount, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
