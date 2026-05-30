-- 001_initial_schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  login         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'visitor'
                CHECK (role IN ('admin','seller','visitor')),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS product_classes (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(200) NOT NULL,
  description    TEXT,
  category_id    INT  REFERENCES categories(id) ON DELETE SET NULL,
  class_id       INT  REFERENCES product_classes(id) ON DELETE SET NULL,
  unit           VARCHAR(50),
  packaging_unit VARCHAR(50),
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiry_date    DATE NOT NULL,
  quantity       INT  NOT NULL DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone          VARCHAR(30),
  email          VARCHAR(100),
  address        TEXT
);

CREATE TABLE IF NOT EXISTS supplies (
  id             SERIAL PRIMARY KEY,
  supplier_id    INT REFERENCES suppliers(id) ON DELETE SET NULL,
  supply_date    TIMESTAMP DEFAULT NOW(),
  total_purchase DECIMAL(12,2) DEFAULT 0,
  total_sale     DECIMAL(12,2) DEFAULT 0,
  created_by     INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS supply_items (
  id             SERIAL PRIMARY KEY,
  supply_id      INT REFERENCES supplies(id) ON DELETE CASCADE,
  product_id     INT REFERENCES products(id) ON DELETE SET NULL,
  quantity       INT NOT NULL,
  purchase_price DECIMAL(10,2),
  sale_price     DECIMAL(10,2),
  expiry_date    DATE
);

CREATE TABLE IF NOT EXISTS sales (
  id           SERIAL PRIMARY KEY,
  sale_date    TIMESTAMP DEFAULT NOW(),
  seller_id    INT REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sale_items (
  id         SERIAL PRIMARY KEY,
  sale_id    INT REFERENCES sales(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  quantity   INT NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS returns (
  id             SERIAL PRIMARY KEY,
  supply_item_id INT REFERENCES supply_items(id) ON DELETE CASCADE,
  return_date    DATE DEFAULT CURRENT_DATE,
  quantity       INT NOT NULL,
  reason         TEXT
);

CREATE TABLE IF NOT EXISTS write_offs (
  id             SERIAL PRIMARY KEY,
  product_id     INT REFERENCES products(id) ON DELETE SET NULL,
  quantity       INT NOT NULL,
  write_off_date DATE DEFAULT CURRENT_DATE,
  reason         TEXT DEFAULT 'expired'
);

-- Default admin user (password: Admin1234!)
INSERT INTO users (login, password_hash, role)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (login) DO NOTHING;

-- Default dictionary data for admin selects
INSERT INTO categories (name)
SELECT v.name
FROM (VALUES
  ('Анальгетики'),
  ('Вітаміни'),
  ('Антибіотики'),
  ('Протизастудні')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name
);

INSERT INTO product_classes (name, category_id)
SELECT v.name, c.id
FROM (VALUES
  ('Знеболювальні', 'Анальгетики'),
  ('Комплексні вітаміни', 'Вітаміни'),
  ('Пеніциліни', 'Антибіотики'),
  ('Порошки та сиропи', 'Протизастудні')
) AS v(name, category_name)
JOIN categories c ON c.name = v.category_name
WHERE NOT EXISTS (
  SELECT 1
  FROM product_classes pc
  WHERE pc.name = v.name
    AND pc.category_id = c.id
);
