import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const inovaStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const { inovaHealth } = await import('./inovastudio.server');
  return await inovaHealth();
});

const ProductInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  longDescription: z.string().max(20000).optional(),
  price: z.number().nonnegative(),
  promoPrice: z.number().nonnegative().optional(),
  stock: z.number().int().min(0).max(9999).optional(),
  weightGrams: z.number().nonnegative().optional(),
  categorySlug: z.string().max(80).optional(),
  featured: z.boolean().optional(),
  image: z.string().max(8_000_000).optional(),
  extraImages: z.array(z.string().max(8_000_000)).max(7).optional(),
});

export const inovaCreateProduct = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => ProductInput.parse(input))
  .handler(async ({ data }) => {
    const { createInovaProduct } = await import('./inovastudio.server');
    return await createInovaProduct(data);
  });