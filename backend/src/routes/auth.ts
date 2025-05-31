import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { User, Prisma } from '@prisma/client'; // Import User and Prisma types from Prisma client

// Extend Prisma's User type to include the password
interface UserWithPassword extends User {
  password?: string; // Make password optional as it might not always be selected
}

// Define schemas for request bodies and responses
const UserResponseSchema = Type.Object({ // Schema for user data in response (without password)
  id: Type.String(),
  email: Type.String({ format: 'email' }),
  name: Type.Optional(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

const SignUpBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 6 }),
  name: Type.Optional(Type.String()),
});

const LoginBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String(),
});

const AuthResponseSchema = Type.Object({
  token: Type.String(),
  user: UserResponseSchema, // Use UserResponseSchema here
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/signup', {
    schema: {
      body: SignUpBodySchema,
      response: {
        201: AuthResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { email, password, name } = request.body as typeof SignUpBodySchema.static;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        }, // @ts-ignore
        select: { // Select fields to return, excluding password
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '1h' });

      reply.status(201).send({ token, user });
    } catch (error: any) {
      if (error.code === 'P2002') { // Unique constraint failed
        reply.status(409).send({ message: 'User with this email already exists.' });
      } else {
        fastify.log.error(error);
        reply.status(500).send({ message: 'Internal server error.' });
      }
    }
  });

  fastify.post('/login', {
    schema: {
      body: LoginBodySchema,
      response: {
        200: AuthResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as typeof LoginBodySchema.static;

    const userWithPassword: UserWithPassword | null = await prisma.user.findUnique({
      where: { email },
      select: { // Explicitly select password for comparison
        id: true,
        email: true,
        password: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }, // @ts-ignore
    });

    if (!userWithPassword || !userWithPassword.password) {
      return reply.status(401).send({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);

    if (!isPasswordValid) {
      return reply.status(401).send({ message: 'Invalid credentials.' });
    }

    // Exclude password from the user object sent in the response
    const { password: _, ...user } = userWithPassword;

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '1h' });

    reply.status(200).send({ token, user });
  });
};

export default authRoutes;
