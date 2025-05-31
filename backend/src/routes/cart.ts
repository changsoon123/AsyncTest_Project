import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import prisma from '../lib/prisma';

// Schemas for CartItem
const CartItemSchema = Type.Object({
  id: Type.String(),
  productId: Type.String(),
  userId: Type.String(),
  quantity: Type.Number(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

const AddToCartBodySchema = Type.Object({
  productId: Type.String(),
  quantity: Type.Number({ minimum: 1 }),
});

const UpdateCartItemBodySchema = Type.Object({
  quantity: Type.Number({ minimum: 1 }),
});

const cartRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware to get user ID from JWT (placeholder for now)
  fastify.addHook('preHandler', async (request, reply) => {
    // In a real application, you would parse the JWT from the Authorization header
    // and extract the userId. For now, we'll use a placeholder.
    // This assumes a user is authenticated to interact with their cart.
    request.userId = 'clx00000000000000000000000'; // Placeholder user ID
    if (!request.userId) {
      return reply.status(401).send({ message: 'Authentication required.' });
    }
  });

  // Add to Cart
  fastify.post('/', {
    schema: {
      body: AddToCartBodySchema,
      response: {
        201: CartItemSchema,
      },
    },
  }, async (request, reply) => {
    const { productId, quantity } = request.body as typeof AddToCartBodySchema.static;
    const userId = request.userId as string; // Assert userId is string

    try {
      let cartItem = await prisma.cartItem.findUnique({
        where: {
          productId_userId: {
            productId,
            userId,
          },
        },
      });

      if (cartItem) {
        // Update quantity if item already exists
        cartItem = await prisma.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity: cartItem.quantity + quantity },
        });
      } else {
        // Create new cart item
        cartItem = await prisma.cartItem.create({
          data: {
            productId,
            userId,
            quantity,
          },
        });
      }
      reply.status(201).send(cartItem);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({ message: 'Failed to add item to cart.' });
    }
  });

  // Get User's Cart
  fastify.get('/', {
    schema: {
      response: {
        200: Type.Array(CartItemSchema),
      },
    },
  }, async (request, reply) => {
    const userId = request.userId as string; // Assert userId is string
    try {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true }, // Include product details
      });
      reply.status(200).send(cartItems);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({ message: 'Failed to fetch cart.' });
    }
  });

  // Update Cart Item Quantity
  fastify.put('/:id', {
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: UpdateCartItemBodySchema,
      response: {
        200: CartItemSchema,
        404: Type.Object({ message: Type.String() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { quantity } = request.body as typeof UpdateCartItemBodySchema.static;
    const userId = request.userId as string; // Assert userId is string

    try {
      const cartItem = await prisma.cartItem.update({
        where: { id, userId }, // Ensure user owns the cart item
        data: { quantity },
      });
      reply.status(200).send(cartItem);
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        reply.status(404).send({ message: 'Cart item not found or does not belong to user.' });
      } else {
        fastify.log.error(error);
        reply.status(500).send({ message: 'Failed to update cart item.' });
      }
    }
  });

  // Remove from Cart
  fastify.delete('/:id', {
    schema: {
      params: Type.Object({ id: Type.String() }),
      response: {
        204: Type.Null(),
        404: Type.Object({ message: Type.String() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.userId as string; // Assert userId is string

    try {
      await prisma.cartItem.delete({
        where: { id, userId }, // Ensure user owns the cart item
      });
      reply.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        reply.status(404).send({ message: 'Cart item not found or does not belong to user.' });
      } else {
        fastify.log.error(error);
        reply.status(500).send({ message: 'Failed to remove item from cart.' });
      }
    }
  });
};

export default cartRoutes;
