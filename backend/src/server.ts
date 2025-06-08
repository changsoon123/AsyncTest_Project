import Fastify, { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import mercurius from 'mercurius';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import redis from './lib/redis'; // Import Redis client
import authRoutes from './routes/auth'; // Import authRoutes
import productsRoutes from './routes/products'; // Import productsRoutes
import cartRoutes from './routes/cart'; // Import cartRoutes
import searchRoutes from './routes/search'; // Import searchRoutes
import aiRoutes from './routes/ai'; // Import aiRoutes

// Define a basic GraphQL schema
const typeDefs = gql`
  type Query {
    hello: String
    redisTest: String
  }
`;

// Define resolvers for the GraphQL schema
const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    redisTest: async () => {
      try {
        await redis.set('test_key', 'test_value');
        const value = await redis.get('test_key');
        return `Redis test: ${value}`;
      } catch (error: any) { // Cast error to any
        console.error('Redis test error:', error);
        return `Redis test failed: ${error.message}`;
      }
    },
  },
};

const startServer = async () => {
  const app: FastifyInstance = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    trustProxy: true,
    bodyLimit: 1048576, // 1MB
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Register GraphQL
  await app.register(mercurius, {
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    graphiql: process.env.NODE_ENV === 'development',
    ide: process.env.NODE_ENV === 'development',
    path: '/api/graphql',
    context: async (request) => ({
      redis, // Make redis available in GraphQL context
      // Add data sources or user context here
    }),
  });

  // Register authentication routes
  await app.register(authRoutes, { prefix: '/auth' });

  // Register products routes
  await app.register(productsRoutes, { prefix: '/products' });

  // Register cart routes
  await app.register(cartRoutes, { prefix: '/cart' });

  // Register search routes
  await app.register(searchRoutes, { prefix: '/search' });

  // Register AI routes
  await app.register(aiRoutes, { prefix: '/ai' });

  // Basic route
  app.get('/', async (request, reply) => {
    return { message: 'AsyncFlow Commerce Backend is running!' };
  });

  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    app.log.info(`Server listening on ${host}:${port}`);
    app.log.info(`GraphQL IDE available at http://${host}:${port}/api/graphql`);
  } catch (err: any) { // Cast error to any
    app.log.error(err);
    process.exit(1);
  }
};

startServer();
