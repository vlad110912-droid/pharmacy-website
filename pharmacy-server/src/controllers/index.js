const ProductRepository = require('../repositories/ProductRepository');
const SaleRepository    = require('../repositories/SaleRepository');
const SupplyRepository  = require('../repositories/SupplyRepository');
const { ReturnRepository, WriteOffRepository } = require('../repositories/ReturnRepository');
const { CategoryRepository, ProductClassRepository, SupplierRepository } = require('../repositories/DictRepositories');
const UserRepository    = require('../repositories/UserRepository');
const { validationResult } = require('express-validator');

const ProductService = require('../services/ProductService');
const SaleService    = require('../services/SaleService');
const { SupplyService, ReportService, AuthService } = require('../services/Services');
const OrderService = require('../services/OrderService');

// Composition root — wiring dependencies
const writeOffRepo  = new WriteOffRepository();
const productRepo   = new ProductRepository();
const saleRepo      = new SaleRepository();
const supplyRepo    = new SupplyRepository();
const returnRepo    = new ReturnRepository();
const userRepo      = new UserRepository();
const orderRepo     = new (require('../repositories/OrderRepository'))();

const productService = new ProductService(productRepo, writeOffRepo);
const saleService    = new SaleService(saleRepo, productRepo);
const supplyService  = new SupplyService(supplyRepo, productRepo, returnRepo);
const reportService  = new ReportService(supplyRepo, saleRepo, returnRepo, orderRepo);
const authService    = new AuthService(userRepo);
const orderService   = new OrderService(orderRepo, productRepo);

const categoryRepo     = new CategoryRepository();
const productClassRepo = new ProductClassRepository();
const supplierRepo     = new SupplierRepository();

// ─── Product Controller ───────────────────────────────────────────────────────
const productController = {
  async getAll(req, res, next) {
    try { res.json(await productService.getAll(req.query)); } catch (e) { next(e); }
  },
  async getById(req, res, next) {
    try { res.json(await productService.getById(req.params.id)); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try { res.status(201).json(await productService.create(req.body)); } catch (e) { next(e); }
  },
  async update(req, res, next) {
    try { res.json(await productService.update(req.params.id, req.body)); } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try { await productService.delete(req.params.id); res.status(204).end(); } catch (e) { next(e); }
  },
  async getExpiring(req, res, next) {
    try { res.json(await productService.getExpiringProducts(req.query.days || 30)); } catch (e) { next(e); }
  },
  async writeOffExpired(req, res, next) {
    try { res.json(await productService.writeOffExpired()); } catch (e) { next(e); }
  },
  async batchWriteOff(req, res, next) {
    try {
      const { productIds, reason } = req.body;
      res.json(await productService.batchWriteOff(productIds, reason));
    } catch (e) { next(e); }
  },
};

// ─── Sale Controller ──────────────────────────────────────────────────────────
const saleController = {
  async getAll(req, res, next) {
    try { res.json(await saleService.getAll(req.query)); } catch (e) { next(e); }
  },
  async getById(req, res, next) {
    try { res.json(await saleService.getById(req.params.id)); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try {
      const { items } = req.body;
      const sellerId = req.user.id;
      res.status(201).json(await saleService.registerSale(sellerId, items));
    } catch (e) { next(e); }
  },
};

// ─── Supply Controller ────────────────────────────────────────────────────────
const supplyController = {
  async getAll(req, res, next) {
    try { res.json(await supplyService.getAll()); } catch (e) { next(e); }
  },
  async getById(req, res, next) {
    try { res.json(await supplyService.getById(req.params.id)); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try {
      const { supplierId, items } = req.body;
      res.status(201).json(await supplyService.createSupply(supplierId, req.user.id, items));
    } catch (e) { next(e); }
  },
};

// ─── Return Controller ────────────────────────────────────────────────────────
const returnController = {
  async create(req, res, next) {
    try {
      const { supplyItemId, quantity, reason } = req.body;
      res.status(201).json(await supplyService.processReturn(supplyItemId, quantity, reason));
    } catch (e) { next(e); }
  },
};

// ─── Report Controller ────────────────────────────────────────────────────────
const reportController = {
  async summary(req, res, next) {
    try {
      const { dateFrom, dateTo } = req.query;
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ error: 'Параметри dateFrom та dateTo обов\'язкові' });
      }
      res.json(await reportService.getSummaryReport(dateFrom, dateTo));
    } catch (e) { next(e); }
  },
};

// ─── Auth Controller ──────────────────────────────────────────────────────────
const authController = {
  async login(req, res, next) {
    try {
      const { login, password } = req.body;
      res.json(await authService.login(login, password));
    } catch (e) { next(e); }
  },
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { login, password, role } = req.body;
      res.status(201).json(await authService.register(login, password, role));
    } catch (e) { next(e); }
  },
};

// ─── Dict Controllers ─────────────────────────────────────────────────────────
const dictController = {
  async getCategories(req, res, next) {
    try { res.json(await categoryRepo.findAll()); } catch (e) { next(e); }
  },
  async createCategory(req, res, next) {
    try { res.status(201).json(await categoryRepo.create(req.body)); } catch (e) { next(e); }
  },
  async getClasses(req, res, next) {
    try { res.json(await productClassRepo.findAll(req.query.categoryId)); } catch (e) { next(e); }
  },
  async createClass(req, res, next) {
    try { res.status(201).json(await productClassRepo.create(req.body)); } catch (e) { next(e); }
  },
  async getSuppliers(req, res, next) {
    try { res.json(await supplierRepo.findAll()); } catch (e) { next(e); }
  },
  async createSupplier(req, res, next) {
    try { res.status(201).json(await supplierRepo.create(req.body)); } catch (e) { next(e); }
  },
  async updateSupplier(req, res, next) {
    try { res.json(await supplierRepo.update(req.params.id, req.body)); } catch (e) { next(e); }
  },
  async deleteSupplier(req, res, next) {
    try { await supplierRepo.delete(req.params.id); res.status(204).end(); } catch (e) { next(e); }
  },
};

// ─── Order Controller ───────────────────────────────────────────────────────
const orderController = {
  async create(req, res, next) {
    try {
      const userId = req.user ? req.user.id : (await userRepo.getOrCreateGuestUser()).id;
      const created = await orderService.createOrder(userId, req.body);
      res.status(201).json(created);
    } catch (e) { next(e); }
  },
  async getById(req, res, next) {
    try { res.json(await orderService.getById(req.params.id)); } catch (e) { next(e); }
  },
  async getAll(req, res, next) {
    try { res.json(await orderService.getAll()); } catch (e) { next(e); }
  },
  async getMyOrders(req, res, next) {
    try { res.json(await orderService.getByUser(req.user.id)); } catch (e) { next(e); }
  },
  async updateStatus(req, res, next) {
    try { res.json(await orderService.updateStatus(req.params.id, req.body.status)); } catch (e) { next(e); }
  }
};

// ─── User Admin Controller ─────────────────────────────────────────────────
const userController = {
  async list(req, res, next) {
    try { res.json(await userRepo.findAll()); } catch (e) { next(e); }
  },
  async updateRole(req, res, next) {
    try { res.json(await userRepo.updateRole(req.params.id, req.body.role)); } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try { await userRepo.delete(req.params.id); res.status(204).end(); } catch (e) { next(e); }
  }
};

module.exports = {
  productController, saleController, supplyController,
  returnController, reportController, authController, dictController,
  orderController, userController,
};
