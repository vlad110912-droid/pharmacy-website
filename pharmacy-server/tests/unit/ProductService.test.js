const ProductService = require('../../src/services/ProductService');

describe('ProductService', () => {
  let service;
  let mockRepo;
  let mockWriteOffRepo;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockResolvedValue({}),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue(undefined),
      findExpiring: jest.fn(),
    };
    mockWriteOffRepo = {
      create: jest.fn().mockResolvedValue({}),
    };
    service = new ProductService(mockRepo, mockWriteOffRepo);
  });

  test('getById — повертає товар', async () => {
    const product = { id: 1, name: 'Test', isExpired: () => false };
    mockRepo.findById.mockResolvedValue(product);
    const result = await service.getById(1);
    expect(result.name).toBe('Test');
  });

  test('getById — кидає 404 якщо не знайдено', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow('не знайдено');
  });

  test('getAll — повертає всі товари з фільтрами', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: 1 }]);
    const filters = { categoryId: 2 };
    const result = await service.getAll(filters);
    expect(result).toEqual([{ id: 1 }]);
    expect(mockRepo.findAll).toHaveBeenCalledWith(filters);
  });

  test('getAll — працює без фільтрів за замовчуванням', async () => {
    mockRepo.findAll.mockResolvedValue([]);
    await service.getAll();
    expect(mockRepo.findAll).toHaveBeenCalledWith({});
  });

  test('create — передає дані в репозиторій', async () => {
    const payload = { name: 'New Product' };
    mockRepo.create.mockResolvedValue({ id: 7, ...payload });
    const result = await service.create(payload);
    expect(result).toEqual({ id: 7, ...payload });
    expect(mockRepo.create).toHaveBeenCalledWith(payload);
  });

  test('update — оновлює існуючий товар', async () => {
    mockRepo.findById.mockResolvedValue({ id: 1, name: 'Old' });
    const payload = { name: 'Updated' };
    const result = await service.update(1, payload);
    expect(result).toEqual({});
    expect(mockRepo.update).toHaveBeenCalledWith(1, payload);
  });

  test('delete — видаляє існуючий товар', async () => {
    mockRepo.findById.mockResolvedValue({ id: 1, name: 'Old' });
    const result = await service.delete(1);
    expect(result).toBeUndefined();
    expect(mockRepo.delete).toHaveBeenCalledWith(1);
  });

  test('getExpiringProducts — сортування за classId і датою', async () => {
    mockRepo.findExpiring.mockResolvedValue([
      { id: 2, classId: 2, expiryDate: new Date('2025-06-01') },
      { id: 1, classId: 1, expiryDate: new Date('2025-05-01') },
      { id: 3, classId: 1, expiryDate: new Date('2025-04-01') },
    ]);
    const result = await service.getExpiringProducts(30);
    expect(result[0].classId).toBe(1);
    expect(result[0].expiryDate).toEqual(new Date('2025-04-01'));
  });

  test('getExpiringProducts — сортує товари одного classId за датою', async () => {
    mockRepo.findExpiring.mockResolvedValue([
      { id: 1, classId: 1, expiryDate: new Date('2025-06-01') },
      { id: 2, classId: 1, expiryDate: new Date('2025-04-01') },
    ]);

    const result = await service.getExpiringProducts();

    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(1);
  });

  test('getExpiringProducts — ставить undefined classId у кінець списку', async () => {
    mockRepo.findExpiring.mockResolvedValue([
      { id: 1, classId: undefined, expiryDate: new Date('2025-04-01') },
      { id: 2, classId: 2, expiryDate: new Date('2025-03-01') },
    ]);

    const result = await service.getExpiringProducts();

    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  test('getExpiringProducts — обробляє classId 0 через fallback', async () => {
    mockRepo.findExpiring.mockResolvedValue([
      { id: 1, classId: 0, expiryDate: new Date('2025-04-01') },
      { id: 2, classId: 1, expiryDate: new Date('2025-03-01') },
    ]);

    const result = await service.getExpiringProducts();

    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  test('writeOffExpired — списує всі прострочені', async () => {
    mockRepo.findAll.mockResolvedValue([
      { id: 1, name: 'Old Drug', quantity: 5 },
      { id: 2, name: 'Another', quantity: 3 },
    ]);
    const result = await service.writeOffExpired();
    expect(result.totalItems).toBe(2);
    expect(mockRepo.update).toHaveBeenCalledTimes(2);
    expect(mockWriteOffRepo.create).toHaveBeenCalledTimes(2);
  });

  test('writeOffExpired — порожній список', async () => {
    mockRepo.findAll.mockResolvedValue([]);
    const result = await service.writeOffExpired();
    expect(result.totalItems).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  test('writeOffExpired — працює без writeOffRepo', async () => {
    service = new ProductService(mockRepo, undefined);
    mockRepo.findAll.mockResolvedValue([
      { id: 1, name: 'Old Drug', quantity: 5 },
    ]);

    const result = await service.writeOffExpired();

    expect(result.totalItems).toBe(1);
    expect(mockRepo.update).toHaveBeenCalledWith(1, { quantity: 0 });
  });

  test('batchWriteOff — пропускає відсутні та порожні товари', async () => {
    mockRepo.findById
      .mockResolvedValueOnce({ id: 1, name: 'A', quantity: 3 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 3, name: 'C', quantity: 0 });

    const result = await service.batchWriteOff([1, 2, 3]);

    expect(result.totalItems).toBe(1);
    expect(mockRepo.update).toHaveBeenCalledWith(1, { quantity: 0 });
    expect(mockWriteOffRepo.create).toHaveBeenCalledWith({
      productId: 1,
      quantity: 3,
      reason: 'manual',
    });
  });

  test('batchWriteOff — використовує передану причину списання', async () => {
    mockRepo.findById.mockResolvedValueOnce({ id: 10, name: 'B', quantity: 4 });

    const result = await service.batchWriteOff([10], 'damaged');

    expect(result.items[0]).toMatchObject({
      id: 10,
      name: 'B',
      writtenOffQty: 4,
      reason: 'damaged',
    });
    expect(mockWriteOffRepo.create).toHaveBeenCalledWith({
      productId: 10,
      quantity: 4,
      reason: 'damaged',
    });
  });

  test('batchWriteOff — працює без writeOffRepo', async () => {
    service = new ProductService(mockRepo, undefined);
    mockRepo.findById.mockResolvedValueOnce({ id: 11, name: 'C', quantity: 2 });

    const result = await service.batchWriteOff([11]);

    expect(result.totalItems).toBe(1);
    expect(mockRepo.update).toHaveBeenCalledWith(11, { quantity: 0 });
  });
});
