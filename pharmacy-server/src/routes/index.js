const router = require('express').Router();
const { authenticate, optionalAuthenticate, requireRole } = require('../middleware/auth');
const { body } = require('express-validator');
const {
  productController, saleController, supplyController,
  returnController, reportController, authController, dictController,
  orderController, userController,
} = require('../controllers');

const registerValidation = [
  body('login')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Логін може містити лише латинські літери та цифри'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль має бути не менш як 6 символів')
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .withMessage('Пароль має містити хоча б одну букву і одну цифру'),
];

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/login',    authController.login);
router.post('/auth/register', registerValidation, authController.register);

// ── Products ──────────────────────────────────────────────────────────────────
router.get('/products',                   productController.getAll);
router.get('/products/expiring',          authenticate, requireRole('admin','seller'), productController.getExpiring);
router.post('/products/write-off-expired',authenticate, requireRole('admin'), productController.writeOffExpired);
router.post('/products/batch-write-off',  authenticate, requireRole('admin'), productController.batchWriteOff);
router.get('/products/:id',               productController.getById);
router.post('/products',                  authenticate, requireRole('admin'), productController.create);
router.put('/products/:id',               authenticate, requireRole('admin'), productController.update);
router.delete('/products/:id',            authenticate, requireRole('admin'), productController.remove);

// ── Supplies ──────────────────────────────────────────────────────────────────
router.get('/supplies',       authenticate, requireRole('admin','seller'), supplyController.getAll);
router.get('/supplies/:id',   authenticate, requireRole('admin','seller'), supplyController.getById);
router.post('/supplies',      authenticate, requireRole('admin','seller'), supplyController.create);

// ── Returns ───────────────────────────────────────────────────────────────────
router.post('/returns',       authenticate, requireRole('admin','seller'), returnController.create);

// ── Sales ─────────────────────────────────────────────────────────────────────
router.get('/sales',          authenticate, requireRole('admin','seller'), saleController.getAll);
router.get('/sales/:id',      authenticate, requireRole('admin','seller'), saleController.getById);
router.post('/sales',         authenticate, requireRole('admin','seller'), saleController.create);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/summary',  authenticate, requireRole('admin'), reportController.summary);

// ── Dictionaries ──────────────────────────────────────────────────────────────
router.get('/categories',       dictController.getCategories);
router.post('/categories',      authenticate, requireRole('admin'), dictController.createCategory);
router.get('/classes',          dictController.getClasses);
router.post('/classes',         authenticate, requireRole('admin'), dictController.createClass);
router.get('/suppliers',        authenticate, requireRole('admin','seller'), dictController.getSuppliers);
router.post('/suppliers',       authenticate, requireRole('admin'), dictController.createSupplier);
router.put('/suppliers/:id',    authenticate, requireRole('admin'), dictController.updateSupplier);
router.delete('/suppliers/:id', authenticate, requireRole('admin'), dictController.deleteSupplier);

// ── Orders & Cart ───────────────────────────────────────────────────────────
router.post('/orders',            optionalAuthenticate, orderController.create);
router.get('/orders/my',          authenticate, orderController.getMyOrders);
router.get('/orders/:id',         orderController.getById);
router.get('/orders',             authenticate, requireRole('admin','seller'), orderController.getAll);
router.put('/orders/:id/status',  authenticate, requireRole('admin','seller'), orderController.updateStatus);

// ── Admin Users ─────────────────────────────────────────────────────────────
router.get('/users',              authenticate, requireRole('admin'), userController.list);
router.put('/users/:id/role',     authenticate, requireRole('admin'), userController.updateRole);
router.delete('/users/:id',       authenticate, requireRole('admin'), userController.remove);

module.exports = router;
