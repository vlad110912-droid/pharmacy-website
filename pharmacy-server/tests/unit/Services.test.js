jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SupplyService, ReportService, AuthService } = require('../../src/services/Services');

describe('SupplyService', () => {
  let service;
  let mockSupplyRepo;
  let mockProductRepo;
  let mockReturnRepo;

  beforeEach(() => {
    mockSupplyRepo = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findAll: jest.fn(),
      findById: jest.fn(),
    };
    mockProductRepo = {
      increaseQty: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockReturnRepo = {
      create: jest.fn().mockResolvedValue({ id: 3 }),
    };
    service = new SupplyService(mockSupplyRepo, mockProductRepo, mockReturnRepo);
  });

  test('createSupply — рахує підсумки і оновлює товари', async () => {
    const items = [
      { productId: 1, quantity: 2, purchasePrice: 10, salePrice: 15, expiryDate: '2026-12-31' },
      { productId: null, quantity: 1, purchasePrice: 7, salePrice: 9 },
      { productId: 2, quantity: 1, expiryDate: '2026-12-31' },
    ];

    await expect(service.createSupply(4, 8, items)).resolves.toEqual({ id: 1 });

    expect(mockSupplyRepo.create).toHaveBeenCalledWith({
      supplierId: 4,
      totalPurchase: 27,
      totalSale: 39,
      createdBy: 8,
      items,
    });
    expect(mockProductRepo.increaseQty).toHaveBeenCalledWith(1, 2);
    expect(mockProductRepo.update).toHaveBeenCalledWith(1, { expiryDate: '2026-12-31' });
    expect(mockProductRepo.increaseQty).toHaveBeenCalledWith(2, 1);
    expect(mockProductRepo.update).toHaveBeenCalledWith(2, { expiryDate: '2026-12-31' });
  });

  test('getAll — повертає поставки', async () => {
    mockSupplyRepo.findAll.mockResolvedValue([{ id: 11 }]);
    await expect(service.getAll()).resolves.toEqual([{ id: 11 }]);
  });

  test('getById — повертає поставку', async () => {
    mockSupplyRepo.findById.mockResolvedValue({ id: 22 });
    await expect(service.getById(22)).resolves.toEqual({ id: 22 });
  });

  test('getById — кидає 404 якщо поставку не знайдено', async () => {
    mockSupplyRepo.findById.mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow('не знайдено');
  });

  test('processReturn — створює повернення', async () => {
    await expect(service.processReturn(5, 2, 'damage')).resolves.toEqual({ id: 3 });
    expect(mockReturnRepo.create).toHaveBeenCalledWith({
      supplyItemId: 5,
      quantity: 2,
      reason: 'damage',
    });
  });

  test('processReturn — забороняє нульову кількість', async () => {
    await expect(service.processReturn(5, 0, 'bad')).rejects.toThrow('повинна бути > 0');
  });
});

describe('ReportService', () => {
  let service;
  let mockSupplyRepo;
  let mockSaleRepo;
  let mockReturnRepo;
  let mockOrderRepo;

  beforeEach(() => {
    mockSupplyRepo = { sumByClass: jest.fn() };
    mockSaleRepo = { sumRevenueByClass: jest.fn(), sumCostByClass: jest.fn() };
    mockReturnRepo = { sumByClass: jest.fn() };
    mockOrderRepo = { sumRevenueByClass: jest.fn(), sumCostByClass: jest.fn() };
    service = new ReportService(mockSupplyRepo, mockSaleRepo, mockReturnRepo, mockOrderRepo);
  });

  test('getSummaryReport — об’єднує виручку та собівартість з продажів і замовлень', async () => {
    mockSaleRepo.sumRevenueByClass.mockResolvedValue([
      { classId: 1, className: 'A', total: '80' },
      { classId: 2, className: 'B', total: '50' },
    ]);
    mockSaleRepo.sumCostByClass.mockResolvedValue([
      { classId: 1, className: 'A', total: '30' },
      { classId: 2, className: 'B', total: '20' },
    ]);
    mockOrderRepo.sumRevenueByClass.mockResolvedValue([
      { classId: 1, className: 'A', total: '20' },
    ]);
    mockOrderRepo.sumCostByClass.mockResolvedValue([
      { classId: 1, className: 'A', total: '5' },
    ]);

    const result = await service.getSummaryReport('2024-01-01', '2024-12-31');

    expect(result).toEqual([
      {
        classId: 1,
        className: 'A',
        revenue: 100,
        cost: 35,
        income: 65,
        incomePercent: '68.42',
      },
      {
        classId: 2,
        className: 'B',
        revenue: 50,
        cost: 20,
        income: 30,
        incomePercent: '31.58',
      },
    ]);
  });

  test('getSummaryReport — доход = виручка - собівартість', async () => {
    mockSaleRepo.sumRevenueByClass.mockResolvedValue([
      { classId: 1, className: 'A', total: '50' },
    ]);
    mockSaleRepo.sumCostByClass.mockResolvedValue([
      { classId: 1, className: 'A', total: '20' },
    ]);
    mockOrderRepo.sumRevenueByClass.mockResolvedValue([]);
    mockOrderRepo.sumCostByClass.mockResolvedValue([]);

    const result = await service.getSummaryReport('2024-01-01', '2024-12-31');

    expect(result).toEqual([
      {
        classId: 1,
        className: 'A',
        revenue: 50,
        cost: 20,
        income: 30,
        incomePercent: '100.00',
      },
    ]);
  });

  test('getSummaryReport — підставляє 0 для відсутніх total', async () => {
    mockSaleRepo.sumRevenueByClass.mockResolvedValue([
      { classId: 1, className: 'A', total: undefined },
    ]);
    mockSaleRepo.sumCostByClass.mockResolvedValue([
      { classId: 1, className: 'A', total: undefined },
    ]);
    mockOrderRepo.sumRevenueByClass.mockResolvedValue([]);
    mockOrderRepo.sumCostByClass.mockResolvedValue([]);

    const result = await service.getSummaryReport('2024-01-01', '2024-12-31');

    expect(result).toEqual([
      {
        classId: 1,
        className: 'A',
        revenue: 0,
        cost: 0,
        income: 0,
        incomePercent: '0.00',
      },
    ]);
  });

  test('getSummaryReport — створює рядок без собівартості', async () => {
    mockSaleRepo.sumRevenueByClass.mockResolvedValue([
      { classId: 9, className: 'Z', total: undefined },
    ]);
    mockSaleRepo.sumCostByClass.mockResolvedValue([]);
    mockOrderRepo.sumRevenueByClass.mockResolvedValue([]);
    mockOrderRepo.sumCostByClass.mockResolvedValue([]);

    const result = await service.getSummaryReport('2024-01-01', '2024-12-31');

    expect(result).toEqual([
      {
        classId: 9,
        className: 'Z',
        revenue: 0,
        cost: 0,
        income: 0,
        incomePercent: '0.00',
      },
    ]);
  });
});

describe('AuthService', () => {
  let service;
  let mockUserRepo;

  beforeEach(() => {
    mockUserRepo = {
      findByLogin: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    };
    service = new AuthService(mockUserRepo);
    jest.clearAllMocks();
  });

  test('login — повертає токен та користувача', async () => {
    mockUserRepo.findByLogin.mockResolvedValue({
      id: 7,
      login: 'admin',
      role: 'admin',
      password_hash: 'hash',
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token-123');

    await expect(service.login('admin', 'secret')).resolves.toEqual({
      token: 'token-123',
      user: { id: 7, login: 'admin', role: 'admin' },
    });

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 7, login: 'admin', role: 'admin' },
      expect.any(String),
      { expiresIn: expect.any(String) }
    );
  });

  test('login — кидає 401 для невірних даних', async () => {
    mockUserRepo.findByLogin.mockResolvedValue(null);
    await expect(service.login('missing', 'secret')).rejects.toThrow('Невірні облікові дані');
  });

  test('login — кидає 401 якщо пароль не збігається', async () => {
    mockUserRepo.findByLogin.mockResolvedValue({
      id: 7,
      login: 'admin',
      role: 'admin',
      password_hash: 'hash',
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(service.login('admin', 'wrong')).rejects.toThrow('Невірні облікові дані');
  });

  test('register — створює користувача', async () => {
    mockUserRepo.findByLogin.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');

    await expect(service.register('new-user', 'secret', 'seller')).resolves.toEqual({ id: 1 });

    expect(mockUserRepo.create).toHaveBeenCalledWith({
      login: 'new-user',
      passwordHash: 'hashed-password',
      role: 'seller',
    });
  });

  test('register — кидає 409 якщо користувач існує', async () => {
    mockUserRepo.findByLogin.mockResolvedValue({ id: 9 });
    await expect(service.register('admin', 'secret', 'admin')).rejects.toThrow('Користувач вже існує');
  });
});