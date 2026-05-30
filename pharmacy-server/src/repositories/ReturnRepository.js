const { pool } = require('../config/db');

class ReturnRepository {
  async create({ supplyItemId, quantity, reason }) {
    const { rows } = await pool.query(
      `INSERT INTO returns (supply_item_id, quantity, reason) VALUES ($1,$2,$3) RETURNING *`,
      [supplyItemId, quantity, reason]
    );
    return rows[0];
  }

  async sumByClass(dateFrom, dateTo) {
    const { rows } = await pool.query(
      `SELECT cl.id AS "classId", cl.name AS "className",
              SUM(r.quantity * si.purchase_price) AS total
       FROM returns r
       JOIN supply_items si ON r.supply_item_id = si.id
       JOIN products p ON si.product_id = p.id
       JOIN product_classes cl ON p.class_id = cl.id
       WHERE r.return_date BETWEEN $1 AND $2
       GROUP BY cl.id, cl.name`,
      [dateFrom, dateTo]
    );
    return rows;
  }
}

class WriteOffRepository {
  async create({ productId, quantity, reason }) {
    const { rows } = await pool.query(
      `INSERT INTO write_offs (product_id, quantity, reason) VALUES ($1,$2,$3) RETURNING *`,
      [productId, quantity, reason || 'expired']
    );
    return rows[0];
  }

  async findAll() {
    const { rows } = await pool.query(
      `SELECT w.*, p.name AS product_name FROM write_offs w
       LEFT JOIN products p ON w.product_id = p.id
       ORDER BY w.write_off_date DESC`
    );
    return rows;
  }
}

module.exports = { ReturnRepository, WriteOffRepository };
