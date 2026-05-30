const { pool } = require('../config/db');

class SaleRepository {
  async create({ sellerId, totalAmount, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'INSERT INTO sales (seller_id, total_amount) VALUES ($1,$2) RETURNING *',
        [sellerId, totalAmount]
      );
      const sale = rows[0];
      for (const item of items) {
        await client.query(
          'INSERT INTO sale_items (sale_id, product_id, quantity, sale_price) VALUES ($1,$2,$3,$4)',
          [sale.id, item.productId, item.quantity, item.salePrice]
        );
      }
      await client.query('COMMIT');
      return sale;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll({ dateFrom, dateTo } = {}) {
    let query = `
      SELECT s.*, u.login AS seller_login
      FROM sales s
      LEFT JOIN users u ON s.seller_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (dateFrom) { params.push(dateFrom); query += ` AND s.sale_date >= $${params.length}`; }
    if (dateTo)   { params.push(dateTo);   query += ` AND s.sale_date <= $${params.length}`; }
    query += ' ORDER BY s.sale_date DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT s.*, u.login AS seller_login FROM sales s
       LEFT JOIN users u ON s.seller_id = u.id WHERE s.id = $1`, [id]
    );
    if (!rows[0]) return null;
    const sale = rows[0];
    const { rows: items } = await pool.query(
      `SELECT si.*, p.name AS product_name FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id WHERE si.sale_id = $1`, [id]
    );
    sale.items = items;
    return sale;
  }

  async sumByClass(dateFrom, dateTo) {
    const { rows } = await pool.query(
      `SELECT cl.id AS "classId", cl.name AS "className",
              SUM(si.quantity * si.sale_price) AS total
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       JOIN product_classes cl ON p.class_id = cl.id
       WHERE s.sale_date BETWEEN $1 AND $2
       GROUP BY cl.id, cl.name`,
      [dateFrom, dateTo]
    );
    return rows;
  }

  async sumRevenueByClass(dateFrom, dateTo) {
    const { rows } = await pool.query(
      `SELECT cl.id AS "classId", cl.name AS "className",
              SUM(si.quantity * si.sale_price) AS total
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       JOIN product_classes cl ON p.class_id = cl.id
       WHERE s.sale_date BETWEEN $1 AND $2
       GROUP BY cl.id, cl.name`,
      [dateFrom, dateTo]
    );
    return rows;
  }

  async sumCostByClass(dateFrom, dateTo) {
    const { rows } = await pool.query(
      `SELECT cl.id AS "classId", cl.name AS "className",
              SUM(si.quantity * COALESCE(p.purchase_price, 0)) AS total
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       JOIN product_classes cl ON p.class_id = cl.id
       WHERE s.sale_date BETWEEN $1 AND $2
       GROUP BY cl.id, cl.name`,
      [dateFrom, dateTo]
    );
    return rows;
  }
}

module.exports = SaleRepository;
