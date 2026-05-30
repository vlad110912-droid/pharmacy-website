const { pool } = require('../config/db');

class OrderRepository {
  async create(order, items) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO orders (user_id, customer_name, phone, delivery_type, city, pickup_point, payment_method, status, total_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [order.userId, order.customerName, order.phone, order.deliveryType, order.city, order.pickupPoint, order.paymentMethod, order.status || 'created', order.totalAmount]
      );
      const created = rows[0];
      for (const it of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)`,
          [created.id, it.productId, it.quantity, it.unitPrice]
        );
      }
      await client.query('COMMIT');
      return created;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!rows[0]) return null;
    const order = rows[0];
    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    );
    order.items = items;
    return order;
  }

  async findAll() {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    return rows;
  }

  async findByUserId(userId) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }

  async updateStatus(id, status) {
    const { rows } = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return rows[0] || null;
  }

  async sumRevenueByClass(dateFrom, dateTo) {
    const { rows } = await pool.query(
      `SELECT cl.id AS "classId", cl.name AS "className",
              SUM(oi.quantity * oi.unit_price) AS total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       JOIN product_classes cl ON p.class_id = cl.id
       WHERE o.created_at BETWEEN $1 AND $2
       GROUP BY cl.id, cl.name`,
      [dateFrom, `${dateTo} 23:59:59`]
    );
    return rows;
  }

  async sumCostByClass(dateFrom, dateTo) {
    const { rows } = await pool.query(
      `SELECT cl.id AS "classId", cl.name AS "className",
              SUM(oi.quantity * COALESCE(p.purchase_price, 0)) AS total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       JOIN product_classes cl ON p.class_id = cl.id
       WHERE o.created_at BETWEEN $1 AND $2
       GROUP BY cl.id, cl.name`,
      [dateFrom, `${dateTo} 23:59:59`]
    );
    return rows;
  }
}

module.exports = OrderRepository;
