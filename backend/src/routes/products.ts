import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import prisma from '../lib/prisma';

// Schemas for Product
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

const CreateProductBodySchema = Type.Object({
  name: Type.String(),
  description: Type.Optional(Type.String()),
  price: Type.Number(),
  categoryId: Type.String(),
  imageUrls: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Any()),
});

const UpdateProductBodySchema = Type.Object({
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  price: Type.Optional(Type.Number()),
  categoryId: Type.Optional(Type.String()),
  imageUrls: Type.Optional(Type.Array(Type.String())),
  metadata: Type.Optional(Type.Any()),
});

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create Product
  fastify.post('/', {
    schema: {
      body: CreateProductBodySchema,
      response: {
        201: ProductSchema,
      },
    },
  }, async (request, reply) => {
    const { name, description, price, categoryId, imageUrls, metadata } = request.body as typeof CreateProductBodySchema.static;

    try {
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          categoryId,
          imageUrls,
          metadata,
        },
      });
      reply.status(201).send(product);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({ message: 'Failed to create product.' });
    }
  });

  // Get All Products
  fastify.get('/', {
    schema: {
      response: {
        200: Type.Array(ProductSchema),
      },
    },
  }, async (request, reply) => {
    try {
      const products = await prisma.product.findMany();
      reply.status(200).send(products);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({ message: 'Failed to fetch products.' });
    }
  });

  // Get Product by ID
  fastify.get('/:id', {
    schema: {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: ProductSchema,
        404: Type.Object({ message: Type.String() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }; // Explicitly cast request.params
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        return reply.status(404).send({ message: 'Product not found.' });
      }
      reply.status(200).send(product);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({ message: 'Failed to fetch product.' });
    }
  });

  // Update Product
  fastify.put('/:id', {
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductBodySchema,
      response: {
        200: ProductSchema,
        404: Type.Object({ message: Type.String() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }; // Explicitly cast request.params
    const { name, description, price, categoryId, imageUrls, metadata } = request.body as typeof UpdateProductBodySchema.static;

    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price,
          categoryId,
          imageUrls,
          metadata,
        },
      });
      reply.status(200).send(product);
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        reply.status(404).send({ message: 'Product not found.' });
      } else {
        fastify.log.error(error);
        reply.status(500).send({ message: 'Failed to update product.' });
      }
    }
  });

  // Delete Product
  fastify.delete('/:id', {
    schema: {
      params: Type.Object({ id: Type.String() }),
      response: {
        204: Type.Null(),
        404: Type.Object({ message: Type.String() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }; // Explicitly cast request.params
    try {
      await prisma.product.delete({
        where: { id },
      });
      reply.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        reply.status(404).send({ message: 'Product not found.' });
      } else {
        fastify.log.error(error);
        reply.status(500).send({ message: 'Failed to delete product.' });
      }
    }
  });
};

export default productsRoutes;
