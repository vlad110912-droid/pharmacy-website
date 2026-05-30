const SaleService = require('../../src/services/SaleService');

describe('SaleService.registerSale()', () => {
  let saleService;
  let mockProductRepo;
  let mockSaleRepo;

  beforeEach(() => {
    mockProductRepo = {
      findById: jest.fn(),
      decreaseQty: jest.fn().mockResolvedValue(undefined),
    };
    mockSaleRepo = {
      create: jest.fn().mockResolvedValue({ id: 1, total_amount: 50 }),
    };
    saleService = new SaleService(mockSaleRepo, mockProductRepo);
  });

  test('успішна реєстрація продажу', async () => {
    mockProductRepo.findById.mockResolvedValue({
      id: 1, name: 'Аспірин', quantity: 10, salePrice: 25,
      isExpired: () => false,
    });
    const result = await saleService.registerSale(1, [{ productId: 1, quantity: 2 }]);
    expect(result).toHaveProperty('id');
    expect(mockProductRepo.decreaseQty).toHaveBeenCalledWith(1, 2);
  });

  test('помилка — недостатньо залишків', async () => {
    mockProductRepo.findById.mockResolvedValue({
      id: 1, name: 'Аспірин', quantity: 1, salePrice: 25,
      isExpired: () => false,
    });
    await expect(
      saleService.registerSale(1, [{ productId: 1, quantity: 5 }])
    ).rejects.toThrow('Недостатньо залишків');
  });

  test('помилка — прострочений товар', async () => {
    mockProductRepo.findById.mockResolvedValue({
      id: 1, name: 'Аспірин', quantity: 10, salePrice: 25,
      isExpired: () => true,
    });
    await expect(
      saleService.registerSale(1, [{ productId: 1, quantity: 1 }])
    ).rejects.toThrow('прострочений');
  });

  test('помилка — товар не знайдено', async () => {
    mockProductRepo.findById.mockResolvedValue(null);
    await expect(
      saleService.registerSale(1, [{ productId: 99, quantity: 1 }])
    ).rejects.toThrow('не знайдено');
  });

  test('успішна реєстрація кількох позицій рахує totalAmount', async () => {
    mockProductRepo.findById
      .mockResolvedValueOnce({
        id: 1, name: 'Аспірин', quantity: 10, salePrice: 25,
        isExpired: () => false,
      })
      .mockResolvedValueOnce({
        id: 2, name: 'Вітамін C', quantity: 5, salePrice: 10,
        isExpired: () => false,
      })
      .mockResolvedValueOnce({
        id: 1, name: 'Аспірин', quantity: 10, salePrice: 25,
        isExpired: () => false,
      })
      .mockResolvedValueOnce({
        id: 2, name: 'Вітамін C', quantity: 5, salePrice: 10,
        isExpired: () => false,
      });

    const result = await saleService.registerSale(7, [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 3 },
    ]);

    expect(result).toHaveProperty('id', 1);
    expect(mockSaleRepo.create).toHaveBeenCalledWith({
      sellerId: 7,
      totalAmount: 80,
      items: [
        { productId: 1, quantity: 2, salePrice: 25 },
        { productId: 2, quantity: 3, salePrice: 10 },
      ],
    });
    expect(mockProductRepo.decreaseQty).toHaveBeenNthCalledWith(1, 1, 2);
    expect(mockProductRepo.decreaseQty).toHaveBeenNthCalledWith(2, 2, 3);
  });

  test('getAll — повертає продажі з фільтрами', async () => {
    mockSaleRepo.findAll = jest.fn().mockResolvedValue([{ id: 1 }]);
    const filters = { sellerId: 5 };
    const result = await saleService.getAll(filters);
    expect(result).toEqual([{ id: 1 }]);
    expect(mockSaleRepo.findAll).toHaveBeenCalledWith(filters);
  });

  test('getAll — працює без фільтрів за замовчуванням', async () => {
    mockSaleRepo.findAll = jest.fn().mockResolvedValue([]);
    await saleService.getAll();
    expect(mockSaleRepo.findAll).toHaveBeenCalledWith({});
  });

  test('getById — повертає продаж', async () => {
    mockSaleRepo.findById = jest.fn().mockResolvedValue({ id: 12 });
    await expect(saleService.getById(12)).resolves.toEqual({ id: 12 });
  });

  test('getById — кидає 404 якщо продаж не знайдено', async () => {
    mockSaleRepo.findById = jest.fn().mockResolvedValue(null);
    await expect(saleService.getById(999)).rejects.toThrow('не знайдено');
  });
});
