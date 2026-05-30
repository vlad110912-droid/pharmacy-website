import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../api/index.js';

export function useProducts(initialFilters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [filters, setFilters]   = useState(initialFilters);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, loading, error, setFilters, refetch: fetchProducts };
}
