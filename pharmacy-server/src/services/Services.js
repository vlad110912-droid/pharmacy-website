// ─── SupplyService ────────────────────────────────────────────────────────────
class SupplyService {
  constructor(supplyRepo, productRepo, returnRepo) {
    this._supplyRepo  = supplyRepo;
    this._productRepo = productRepo;
    this._returnRepo  = returnRepo;
  }

  async createSupply(supplierId, createdBy, items) {
    let totalPurchase = 0;
    let totalSale     = 0;
    for (const item of items) {
      totalPurchase += (item.purchasePrice || 0) * item.quantity;
      totalSale     += (item.salePrice || 0) * item.quantity;
    }
    const supply = await this._supplyRepo.create({
      supplierId, totalPurchase, totalSale, createdBy, items,
    });
    // Increase stock for each item
    for (const item of items) {
      if (item.productId) {
        await this._productRepo.increaseQty(item.productId, item.quantity);
        // Update expiry_date on product if newer
        await this._productRepo.update(item.productId, { expiryDate: item.expiryDate });
      }
    }
    return supply;
  }

  async getAll() {
    return this._supplyRepo.findAll();
  }

  async getById(id) {
    const supply = await this._supplyRepo.findById(id);
    if (!supply) {
      const err = new Error('Поставку не знайдено');
      err.statusCode = 404;
      throw err;
    }
    return supply;
  }

  async processReturn(supplyItemId, quantity, reason) {
    if (quantity <= 0) {
      const err = new Error('Кількість повернення повинна бути > 0');
      err.statusCode = 400;
      throw err;
    }
    const ret = await this._returnRepo.create({ supplyItemId, quantity, reason });
    return ret;
  }
}

// ─── ReportService ────────────────────────────────────────────────────────────
class ReportService {
  constructor(supplyRepo, saleRepo, returnRepo, orderRepo) {
    this._supplyRepo = supplyRepo;
    this._saleRepo   = saleRepo;
    this._returnRepo = returnRepo;
    this._orderRepo  = orderRepo;
  }

  async getSummaryReport(dateFrom, dateTo) {
    const [salesRevenue, salesCost, ordersRevenue, ordersCost] = await Promise.all([
      this._saleRepo?.sumRevenueByClass
        ? this._saleRepo.sumRevenueByClass(dateFrom, dateTo)
        : (this._saleRepo?.sumByClass ? this._saleRepo.sumByClass(dateFrom, dateTo) : []),
      this._saleRepo?.sumCostByClass
        ? this._saleRepo.sumCostByClass(dateFrom, dateTo)
        : [],
      this._orderRepo?.sumRevenueByClass
        ? this._orderRepo.sumRevenueByClass(dateFrom, dateTo)
        : [],
      this._orderRepo?.sumCostByClass
        ? this._orderRepo.sumCostByClass(dateFrom, dateTo)
        : [],
    ]);

    const map = {};

    const ensure = (row) => {
      if (!map[row.classId]) {
        map[row.classId] = {
          classId: row.classId,
          className: row.className,
          revenue: 0,
          cost: 0,
        };
      }
      return map[row.classId];
    };

    for (const row of salesRevenue) {
      ensure(row).revenue += parseFloat(row.total) || 0;
    }
    for (const row of ordersRevenue) {
      ensure(row).revenue += parseFloat(row.total) || 0;
    }
    for (const row of salesCost) {
      ensure(row).cost += parseFloat(row.total) || 0;
    }
    for (const row of ordersCost) {
      ensure(row).cost += parseFloat(row.total) || 0;
    }

    const rows = Object.values(map);
    const totalIncome = rows.reduce((sum, r) => sum + (r.revenue - r.cost), 0);

    return rows.map(r => {
      const income = r.revenue - r.cost;
      return {
      classId: r.classId,
      className: r.className,
      revenue: r.revenue,
      cost: r.cost,
      income,
      incomePercent: totalIncome > 0
        ? (income / totalIncome * 100).toFixed(2)
        : '0.00',
    }}).sort((a, b) => a.className.localeCompare(b.className, 'uk'));
  }
}

// ─── AuthService ──────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

class AuthService {
  constructor(userRepo) {
    this._userRepo = userRepo;
  }

  async login(login, password) {
    const user = await this._userRepo.findByLogin(login);
    if (!user) {
      const err = new Error('Невірні облікові дані');
      err.statusCode = 401;
      throw err;
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const err = new Error('Невірні облікові дані');
      err.statusCode = 401;
      throw err;
    }
    const token = jwt.sign(
      { id: user.id, login: user.login, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return { token, user: { id: user.id, login: user.login, role: user.role } };
  }

  async register(login, password, role) {
    const existing = await this._userRepo.findByLogin(login);
    if (existing) {
      const err = new Error('Користувач вже існує');
      err.statusCode = 409;
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return this._userRepo.create({ login, passwordHash, role });
  }
}

module.exports = { SupplyService, ReportService, AuthService };
