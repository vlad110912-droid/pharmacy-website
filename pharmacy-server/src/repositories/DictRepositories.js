const { pool } = require('../config/db');

class CategoryRepository {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
    return rows;
  }
  async create({ name }) {
    const { rows } = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]
    );
    return rows[0];
  }
  async update(id, { name }) {
    const { rows } = await pool.query(
      'UPDATE categories SET name=$1 WHERE id=$2 RETURNING *', [name, id]
    );
    return rows[0];
  }
  async delete(id) {
    await pool.query('DELETE FROM categories WHERE id=$1', [id]);
  }
}

class ProductClassRepository {
  async findAll(categoryId) {
    let query = 'SELECT pc.*, c.name AS category_name FROM product_classes pc LEFT JOIN categories c ON pc.category_id = c.id';
    const params = [];
    if (categoryId) { params.push(categoryId); query += ` WHERE pc.category_id = $1`; }
    query += ' ORDER BY pc.name';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  async create({ name, categoryId }) {
    const { rows } = await pool.query(
      'INSERT INTO product_classes (name, category_id) VALUES ($1,$2) RETURNING *',
      [name, categoryId]
    );
    return rows[0];
  }
}

class SupplierRepository {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM suppliers ORDER BY name');
    return rows;
  }
  async create({ name, contactPerson, phone, email, address }) {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, contactPerson, phone, email, address]
    );
    return rows[0];
  }
  async update(id, data) {
    const { rows } = await pool.query(
      `UPDATE suppliers SET name=$1, contact_person=$2, phone=$3, email=$4, address=$5
       WHERE id=$6 RETURNING *`,
      [data.name, data.contactPerson, data.phone, data.email, data.address, id]
    );
    return rows[0];
  }
  async delete(id) {
    await pool.query('DELETE FROM suppliers WHERE id=$1', [id]);
  }
}

module.exports = { CategoryRepository, ProductClassRepository, SupplierRepository };
