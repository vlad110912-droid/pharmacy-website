-- 004_orders_schema.sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL,
  city TEXT,
  pickup_point TEXT,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  total_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL
);

-- index to speed up lookups by user
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
