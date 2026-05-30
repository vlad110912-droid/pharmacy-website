class ProductService {
  constructor(productRepo, writeOffRepo) {
    this._repo = productRepo;
    this._writeOffRepo = writeOffRepo;
  }

  async getAll(filters = {}) {
    return this._repo.findAll(filters);
  }

  async getById(id) {
    const product = await this._repo.findById(id);
    if (!product) {
      const err = new Error('Препарат не знайдено');
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  async create(data) {
    return this._repo.create(data);
  }

  async update(id, data) {
    await this.getById(id);
    return this._repo.update(id, data);
  }

  async delete(id) {
    await this.getById(id);
    return this._repo.delete(id);
  }

  async getExpiringProducts(daysThreshold = 30) {
    const products = await this._repo.findExpiring(daysThreshold);
    return products.sort((a, b) => {
      if (a.classId !== b.classId) return (a.classId || 0) - (b.classId || 0);
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
  }

  async writeOffExpired() {
    const expired = await this._repo.findAll({ expired: true });
    const results = [];
    for (const product of expired) {
      const qty = product.quantity;
      await this._repo.update(product.id, { quantity: 0 });
      if (this._writeOffRepo) {
        await this._writeOffRepo.create({
          productId: product.id,
          quantity: qty,
          reason: 'expired',
        });
      }
      results.push({ id: product.id, name: product.name, writtenOffQty: qty });
    }
    return { actDate: new Date().toISOString(), items: results, totalItems: results.length };
  }

  async batchWriteOff(productIds, reason = 'manual') {
    const results = [];
    for (const id of productIds) {
      const product = await this._repo.findById(id);
      if (!product || product.quantity <= 0) continue;
      const qty = product.quantity;
      await this._repo.update(id, { quantity: 0 });
      if (this._writeOffRepo) {
        await this._writeOffRepo.create({ productId: id, quantity: qty, reason });
      }
      results.push({ id: product.id, name: product.name, writtenOffQty: qty, date: new Date().toISOString(), reason });
    }
    return { actDate: new Date().toISOString(), items: results, totalItems: results.length };
  }
}

module.exports = ProductService;
