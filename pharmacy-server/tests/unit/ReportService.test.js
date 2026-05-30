const { ReportService } = require('../../src/services/Services');

describe('ReportService.getSummaryReport()', () => {
  let service;
  let mockSupplyRepo, mockSaleRepo, mockReturnRepo, mockOrderRepo;

  beforeEach(() => {
    mockSupplyRepo = { sumByClass: jest.fn() };
    mockSaleRepo   = { sumRevenueByClass: jest.fn(), sumCostByClass: jest.fn(), sumByClass: jest.fn() };
    mockReturnRepo = { sumByClass: jest.fn() };
    mockOrderRepo  = { sumRevenueByClass: jest.fn(), sumCostByClass: jest.fn() };
    service = new ReportService(mockSupplyRepo, mockSaleRepo, mockReturnRepo, mockOrderRepo);
  });

  test('коректно розраховує incomePercent (сума = 100%)', async () => {
    mockSaleRepo.sumRevenueByClass.mockResolvedValue([
      { classId: 1, className: 'Аналгетики', total: '800' },
      { classId: 2, className: 'Вітаміни',   total: '200' },
    ]);
    mockSaleRepo.sumCostByClass.mockResolvedValue([
      { classId: 1, className: 'Аналгетики', total: '300' },
      { classId: 2, className: 'Вітаміни',   total: '100' },
    ]);
    mockOrderRepo.sumRevenueByClass.mockResolvedValue([]);
    mockOrderRepo.sumCostByClass.mockResolvedValue([]);

    const result = await service.getSummaryReport('2024-01-01', '2024-12-31');
    const percentSum = result.reduce((s, r) => s + parseFloat(r.incomePercent), 0);
    expect(percentSum).toBeCloseTo(100, 0);
  });

  test('повертає порожній масив якщо немає даних', async () => {
    mockSaleRepo.sumRevenueByClass.mockResolvedValue([]);
    mockSaleRepo.sumCostByClass.mockResolvedValue([]);
    mockOrderRepo.sumRevenueByClass.mockResolvedValue([]);
    mockOrderRepo.sumCostByClass.mockResolvedValue([]);
    const result = await service.getSummaryReport('2024-01-01', '2024-01-31');
    expect(result).toHaveLength(0);
  });

  test('incomePercent = 0 при нульовому загальному доході', async () => {
    mockSaleRepo.sumRevenueByClass.mockResolvedValue([
      { classId: 1, className: 'Test', total: '500' },
    ]);
    mockSaleRepo.sumCostByClass.mockResolvedValue([
      { classId: 1, className: 'Test', total: '500' },
    ]);
    mockOrderRepo.sumRevenueByClass.mockResolvedValue([]);
    mockOrderRepo.sumCostByClass.mockResolvedValue([]);
    const result = await service.getSummaryReport('2024-01-01', '2024-12-31');
    expect(result[0].incomePercent).toBe('0.00');
  });
});
