const OrderRepository = require('../repositories/OrderRepository');

class OrderService {
  constructor(orderRepo, productRepo) {
    this.orderRepo = orderRepo || new OrderRepository();
    this.productRepo = productRepo;
  }

  async createOrder(userId, payload) {
    const { customerName, phone, deliveryType, city, pickupPoint, paymentMethod, items } = payload;
    if (!items || !items.length) throw new Error('Order must contain items');
    const total = items.reduce((s, it) => s + parseFloat(it.unitPrice) * parseInt(it.quantity, 10), 0);
    const order = {
      userId: userId || null,
      customerName, phone, deliveryType, city, pickupPoint, paymentMethod,
      totalAmount: total,
      status: paymentMethod === 'online' ? 'paid' : 'created'
    };

    // decrease product qty
    for (const it of items) {
      await this.productRepo.decreaseQty(it.productId, it.quantity);
    }

    const created = await this.orderRepo.create(order, items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })));
    return created;
  }

  async getAll() {
    return this.orderRepo.findAll();
  }

  async getById(id) {
    return this.orderRepo.findById(id);
  }

  async getByUser(userId) {
    return this.orderRepo.findByUserId(userId);
  }

  async updateStatus(id, status) {
    return this.orderRepo.updateStatus(id, status);
  }
}

module.exports = OrderService;
