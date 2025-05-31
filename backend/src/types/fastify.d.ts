import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string; // Add custom userId property
  }
}
