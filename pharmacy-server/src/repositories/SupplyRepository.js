const { pool } = require('../config/db');

class SupplyRepository {
  async create({ supplierId, totalPurchase, totalSale, createdBy, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO supplies (supplier_id, total_purchase, total_sale, created_by)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [supplierId, totalPurchase, totalSale, createdBy]
      );
      const supply = rows[0];
      for (const item of items) {
        await client.query(
          `INSERT INTO supply_items (supply_id, product_id, quantity, purchase_price, sale_price, expiry_date)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [supply.id, item.productId, item.quantity,
           item.purchasePrice, item.salePrice, item.expiryDate]
        );
      }
      await client.query('COMMIT');
      return supply;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll() {
    const { rows } = await pool.query(
      `SELECT s.*, sup.name AS supplier_name
       FROM supplies s LEFT JOIN suppliers sup ON s.supplier_id = sup.id
       ORDER BY s.supply_date DESC`
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT s.*, sup.name AS supplier_name
       FROM supplies s LEFT JOIN suppliers sup ON s.supplier_id = sup.id
       WHERE s.id = $1`, [id]
    );
    if (!rows[0]) return null;
    const supply = rows[0];
    const { rows: items } = await pool.query(
      `SELECT si.*, p.name AS product_name FROM supply_items si
       LEFT JOIN products p ON si.product_id = p.id WHERE si.supply_id = $1`, [id]
    );
    supply.items = items;
    return supply;
  }

  async sumByClass(dateFrom, dateTo) {
    const { rows } = await pool.query(
      `SELECT cl.id AS "classId", cl.name AS "className",
              SUM(si.quantity * si.purchase_price) AS total
       FROM supply_items si
       JOIN supplies s ON si.supply_id = s.id
       JOIN products p ON si.product_id = p.id
       JOIN product_classes cl ON p.class_id = cl.id
       WHERE s.supply_date BETWEEN $1 AND $2
       GROUP BY cl.id, cl.name`,
      [dateFrom, dateTo]
    );
    return rows;
  }
}

module.exports = SupplyRepository;
