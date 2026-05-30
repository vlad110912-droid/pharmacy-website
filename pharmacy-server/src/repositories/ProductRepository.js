const { pool } = require('../config/db');
const IProductRepository = require('./IProductRepository');
const Product = require('../models/Product');

class ProductRepository extends IProductRepository {
  async findAll({ name, categoryId, classId, minPrice, maxPrice, expired } = {}) {
    let query = `
      SELECT p.*, c.name AS category_name, cl.name AS class_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_classes cl ON p.class_id = cl.id
      WHERE 1=1
    `;
    const params = [];

    if (name) {
      params.push(`%${name}%`);
      query += ` AND p.name ILIKE $${params.length}`;
    }
    if (categoryId) {
      params.push(categoryId);
      query += ` AND p.category_id = $${params.length}`;
    }
    if (classId) {
      params.push(classId);
      query += ` AND p.class_id = $${params.length}`;
    }
    if (minPrice) {
      params.push(minPrice);
      query += ` AND p.sale_price >= $${params.length}`;
    }
    if (maxPrice) {
      params.push(maxPrice);
      query += ` AND p.sale_price <= $${params.length}`;
    }
    if (expired === true || expired === 'true') {
      query += ` AND p.expiry_date <= CURRENT_DATE AND p.quantity > 0`;
    }

    query += ` ORDER BY p.name`;
    const { rows } = await pool.query(query, params);
    return rows.map(r => new Product(r));
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT p.*, c.name AS category_name, cl.name AS class_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_classes cl ON p.class_id = cl.id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] ? new Product(rows[0]) : null;
  }

  async create(data) {
    const { name, description, categoryId, classId, unit, packagingUnit,
      purchasePrice, salePrice, expiryDate, quantity } = data;
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, category_id, class_id, unit,
        packaging_unit, purchase_price, sale_price, expiry_date, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, description, categoryId, classId, unit, packagingUnit,
        purchasePrice, salePrice, expiryDate, quantity || 0]
    );
    return new Product(rows[0]);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    const map = {
      name: 'name', description: 'description', categoryId: 'category_id',
      classId: 'class_id', unit: 'unit', packagingUnit: 'packaging_unit',
      purchasePrice: 'purchase_price', salePrice: 'sale_price',
      expiryDate: 'expiry_date', quantity: 'quantity',
    };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        values.push(data[key]);
        fields.push(`${col} = $${values.length}`);
      }
    }
    if (!fields.length) return this.findById(id);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return rows[0] ? new Product(rows[0]) : null;
  }

  async delete(id) {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
  }

  async findExpiring(days = 30) {
    const { rows } = await pool.query(
      `SELECT p.*, c.name AS category_name, cl.name AS class_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_classes cl ON p.class_id = cl.id
       WHERE p.expiry_date > CURRENT_DATE
         AND p.expiry_date <= CURRENT_DATE + ($1 || ' days')::INTERVAL
         AND p.quantity > 0
       ORDER BY cl.id, p.expiry_date`,
      [days]
    );
    return rows.map(r => new Product(r));
  }

  async decreaseQty(id, qty) {
    await pool.query(
      'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
      [qty, id]
    );
  }

  async increaseQty(id, qty) {
    await pool.query(
      'UPDATE products SET quantity = quantity + $1 WHERE id = $2',
      [qty, id]
    );
  }
}

module.exports = ProductRepository;
