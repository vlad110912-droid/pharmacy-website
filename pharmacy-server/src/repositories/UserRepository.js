const { pool } = require('../config/db');

class UserRepository {
  async findByLogin(login) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE login = $1', [login]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, login, role, created_at FROM users WHERE id = $1', [id]
    );
    return rows[0] || null;
  }

  async create({ login, passwordHash, role }) {
    const { rows } = await pool.query(
      `INSERT INTO users (login, password_hash, role) VALUES ($1,$2,$3) RETURNING id, login, role`,
      [login, passwordHash, role || 'visitor']
    );
    return rows[0];
  }

  async findAll() {
    const { rows } = await pool.query(
      'SELECT id, login, role, created_at FROM users ORDER BY login'
    );
    return rows;
  }

  async updateRole(id, role) {
    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, login, role, created_at',
      [role, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = UserRepository;
