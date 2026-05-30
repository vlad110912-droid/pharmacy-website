class SaleService {
  constructor(saleRepo, productRepo) {
    this._saleRepo    = saleRepo;
    this._productRepo = productRepo;
  }

  async registerSale(sellerId, items) {
    // 1. Validate stock and expiry for all items
    for (const item of items) {
      const product = await this._productRepo.findById(item.productId);
      if (!product) {
        const err = new Error(`Товар ${item.productId} не знайдено`);
        err.statusCode = 404;
        throw err;
      }
      if (product.quantity < item.quantity) {
        const err = new Error(`Недостатньо залишків для "${product.name}" (є: ${product.quantity}, потрібно: ${item.quantity})`);
        err.statusCode = 400;
        throw err;
      }
      if (product.isExpired()) {
        const err = new Error(`Товар "${product.name}" прострочений`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 2. Calculate total and enrich items with salePrice
    let totalAmount = 0;
    const enrichedItems = [];
    for (const item of items) {
      const product = await this._productRepo.findById(item.productId);
      const lineTotal = product.salePrice * item.quantity;
      totalAmount += lineTotal;
      enrichedItems.push({ ...item, salePrice: product.salePrice });
    }

    // 3. Persist sale (transaction inside repo)
    const sale = await this._saleRepo.create({ sellerId, totalAmount, items: enrichedItems });

    // 4. Decrease stock
    for (const item of enrichedItems) {
      await this._productRepo.decreaseQty(item.productId, item.quantity);
    }

    return sale;
  }

  async getAll(filters = {}) {
    return this._saleRepo.findAll(filters);
  }

  async getById(id) {
    const sale = await this._saleRepo.findById(id);
    if (!sale) {
      const err = new Error('Продаж не знайдено');
      err.statusCode = 404;
      throw err;
    }
    return sale;
  }
}

module.exports = SaleService;
