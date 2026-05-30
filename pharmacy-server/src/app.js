const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  const { pool } = require('./config/db');
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', uptime: Math.floor(process.uptime()) });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api', routes);
app.use(errorHandler);

module.exports = app;
