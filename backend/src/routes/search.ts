import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import prisma from '../lib/prisma';

// Schema for search query
const SearchQuerySchema = Type.Object({
  q: Type.String({ minLength: 1 }), // Search query string
  categoryId: Type.Optional(Type.String()),
  minPrice: Type.Optional(Type.Number({ minimum: 0 })),
  maxPrice: Type.Optional(Type.Number({ minimum: 0 })),
});

// Schema for Product (re-using from products.ts)
const ProductSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  price: Type.Number(),
  categoryId: Type.String(),
  imageUrls: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Any()), // JSON field
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      querystring: SearchQuerySchema,
      response: {
        200: Type.Array(ProductSchema),
      },
    },
  }, async (request, reply) => {
    const { q, categoryId, minPrice, maxPrice } = request.query as typeof SearchQuerySchema.static;

    try {
      const products = await prisma.product.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            categoryId ? { categoryId } : {},
            minPrice ? { price: { gte: minPrice } } : {},
            maxPrice ? { price: { lte: maxPrice } } : {},
          ],
        },
      });
      reply.status(200).send(products);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({ message: 'Failed to perform search.' });
    }
  });
};

export default searchRoutes;
