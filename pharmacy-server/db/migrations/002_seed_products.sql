-- 002_seed_products.sql

WITH seeded_products (name, description, category_name, class_name, unit, packaging_unit, purchase_price, sale_price, expiry_date, quantity) AS (
  VALUES
    ('Парацетамол 500', 'Знеболювальний та жарознижувальний засіб', 'Анальгетики', 'Знеболювальні', 'табл.', 'блістер', 18.50, 32.00, CURRENT_DATE + INTERVAL '180 days', 120),
    ('Ібупрофен', 'НПЗЗ для зменшення болю та запалення', 'Анальгетики', 'Знеболювальні', 'капс.', 'блістер', 28.00, 47.50, CURRENT_DATE + INTERVAL '210 days', 85),
    ('Нейровіт', 'Комплекс вітамінів групи B', 'Вітаміни', 'Комплексні вітаміни', 'капс.', 'блістер', 64.00, 102.00, CURRENT_DATE + INTERVAL '365 days', 60),
    ('Вітамін C 1000', 'Шипучі таблетки для імунної підтримки', 'Вітаміни', 'Комплексні вітаміни', 'табл.', 'туба', 42.00, 73.00, CURRENT_DATE + INTERVAL '300 days', 140),
    ('Амоксицилін', 'Антибіотик широкого спектра дії', 'Антибіотики', 'Пеніциліни', 'капс.', 'блістер', 55.00, 91.00, CURRENT_DATE + INTERVAL '240 days', 70),
    ('Амоксиклав', 'Комбінований антибактеріальний препарат', 'Антибіотики', 'Пеніциліни', 'табл.', 'коробка', 96.00, 148.00, CURRENT_DATE + INTERVAL '220 days', 45),
    ('Колдрекс', 'Порошок для симптоматичного лікування застуди', 'Протизастудні', 'Порошки та сиропи', 'пак.', 'саше', 72.00, 118.00, CURRENT_DATE + INTERVAL '150 days', 50),
    ('Сироп від кашлю', 'Сироп для полегшення кашлю', 'Протизастудні', 'Порошки та сиропи', 'мл', 'флакон', 39.00, 67.00, CURRENT_DATE + INTERVAL '180 days', 95),
    ('Магній B6', 'Препарат магнію та вітаміну B6', 'Вітаміни', 'Комплексні вітаміни', 'табл.', 'блістер', 88.00, 134.00, CURRENT_DATE + INTERVAL '330 days', 55),
    ('Нурофен', 'Знеболювальний та протизапальний засіб', 'Анальгетики', 'Знеболювальні', 'табл.', 'блістер', 34.00, 59.00, CURRENT_DATE + INTERVAL '120 days', 100)
)
INSERT INTO products (
  name,
  description,
  category_id,
  class_id,
  unit,
  packaging_unit,
  purchase_price,
  sale_price,
  expiry_date,
  quantity
)
SELECT
  sp.name,
  sp.description,
  c.id,
  cl.id,
  sp.unit,
  sp.packaging_unit,
  sp.purchase_price,
  sp.sale_price,
  sp.expiry_date,
  sp.quantity
FROM seeded_products sp
JOIN categories c ON c.name = sp.category_name
JOIN product_classes cl ON cl.name = sp.class_name AND cl.category_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = sp.name
);