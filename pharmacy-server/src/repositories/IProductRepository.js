/**
 * @interface IProductRepository
 * Визначається в BLL, реалізується в DAL.
 */
class IProductRepository {
  async findAll(filters)       { throw new Error('Not implemented'); }
  async findById(id)           { throw new Error('Not implemented'); }
  async create(data)           { throw new Error('Not implemented'); }
  async update(id, data)       { throw new Error('Not implemented'); }
  async delete(id)             { throw new Error('Not implemented'); }
  async findExpiring(days)     { throw new Error('Not implemented'); }
  async decreaseQty(id, qty)   { throw new Error('Not implemented'); }
  async increaseQty(id, qty)   { throw new Error('Not implemented'); }
}

module.exports = IProductRepository;
