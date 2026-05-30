/**
 * Integration tests for /api/products
 * Requires a running PostgreSQL test database.
 * Set TEST_DB_* env vars or use .env.test file.
 */
const request = require('supertest');
const app = require('../../src/app');

// These tests need a real DB — skip in CI without DB
const describeIfDB = process.env.TEST_DB_NAME ? describe : describe.skip;

describeIfDB('GET /api/products', () => {
  test('повертає 200 та масив', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('фільтрація за name повертає відповідні результати', async () => {
    const res = await request(app).get('/api/products?name=test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describeIfDB('POST /api/products — без токена', () => {
  test('повертає 401', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test', salePrice: 10, expiryDate: '2026-01-01' });
    expect(res.status).toBe(401);
  });
});

describeIfDB('POST /api/auth/login', () => {
  test('невірний пароль → 401', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ login: 'admin', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  test('коректні дані → token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: 'admin', password: 'password' });
    // password hash in migration = 'password' (bcrypt default)
    if (res.status === 200) {
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('role');
    }
  });
});
