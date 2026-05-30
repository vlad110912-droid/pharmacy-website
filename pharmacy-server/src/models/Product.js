class Product {
  constructor({ id, name, description, category_id, class_id, unit,
    packaging_unit, purchase_price, sale_price, expiry_date, quantity,
    created_at, category_name, class_name }) {
    this.id           = id;
    this.name         = name;
    this.description  = description;
    this.categoryId   = category_id;
    this.classId      = class_id;
    this.unit         = unit;
    this.packagingUnit = packaging_unit;
    this.purchasePrice = parseFloat(purchase_price) || 0;
    this.salePrice    = parseFloat(sale_price) || 0;
    this.expiryDate   = expiry_date ? new Date(expiry_date) : null;
    this.quantity     = parseInt(quantity, 10) || 0;
    this.createdAt    = created_at;
    this.categoryName = category_name;
    this.className    = class_name;
  }

  isExpired() {
    if (!this.expiryDate) return false;
    return this.expiryDate <= new Date();
  }

  isCriticalExpiry(daysThreshold = 30) {
    if (!this.expiryDate) return false;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);
    return this.expiryDate <= threshold && !this.isExpired();
  }

  getMargin() {
    return this.salePrice - this.purchasePrice;
  }
}

module.exports = Product;
