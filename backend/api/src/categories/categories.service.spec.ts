import { CategoriesService } from './categories.service';

describe('CategoriesService localized contract', () => {
  const prisma = {
    category: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const service = new CategoriesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns stable translation keys instead of the legacy Romanian name', async () => {
    prisma.category.findMany.mockResolvedValue([]);

    await service.list();

    const query = prisma.category.findMany.mock.calls[0][0];
    expect(query.select.nameKey).toBe(true);
    expect(query.select.name).toBeUndefined();
    expect(query.select.children.select.nameKey).toBe(true);
    expect(query.select.children.select.name).toBeUndefined();
  });

  it('exposes the country scope for regional categories', async () => {
    prisma.category.findUniqueOrThrow.mockResolvedValue({
      id: 'category-id',
      code: 'country-specific-ro',
      nameKey: 'category.country-specific-ro.name',
      countryCode: 'RO',
      parentId: null,
      icon: 'flag-romania',
      children: [],
    });

    await service.get('category-id');

    expect(prisma.category.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          nameKey: true,
          countryCode: true,
        }),
      }),
    );
  });
});
