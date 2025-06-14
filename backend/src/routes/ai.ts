import { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Static, Type } from '@sinclair/typebox';
import { AIOrchestrator } from '../ai/orchestrator';
import { VectorSearchService } from '../ai/pinecone';
import { Product } from '../types/ai'; // Assuming Product type is available

const aiOrchestrator = new AIOrchestrator();
const vectorSearchService = new VectorSearchService();

// Schemas for request bodies and responses
const ProductDataSchema = Type.Object({
  name: Type.String(),
  category: Type.String(),
  features: Type.Array(Type.String()),
  price: Type.Number(),
});

const NaturalLanguageQuerySchema = Type.Object({
  query: Type.String(),
});

const ProductComparisonSchema = Type.Object({
  productIds: Type.Array(Type.String()),
});

const PersonalizedRecommendationSchema = Type.Object({
  userId: Type.String(),
  browsingHistory: Type.Array(Type.Object({
    productName: Type.String(),
    categoryName: Type.String(),
  })),
  availableProducts: Type.Array(Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    price: Type.Number(),
    categoryId: Type.String(),
    imageUrls: Type.Array(Type.String()),
    metadata: Type.Optional(Type.Any()),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    averageRating: Type.Optional(Type.Number()),
  })),
});

const UpsertProductEmbeddingSchema = Type.Object({
  product: Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    price: Type.Number(),
    categoryId: Type.String(),
    imageUrls: Type.Array(Type.String()),
    metadata: Type.Optional(Type.Any()),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    averageRating: Type.Optional(Type.Number()),
  }),
  embedding: Type.Array(Type.Number()),
});

const SearchSimilarProductsSchema = Type.Object({
  query: Type.String(),
  filters: Type.Optional(Type.Object({
    categoryId: Type.Optional(Type.String()),
    priceRange: Type.Optional(Type.Tuple([Type.Number(), Type.Number()])),
  })),
});

const GenerateTestCasesSchema = Type.Object({
  scenarios: Type.Array(Type.String()),
});

export default async function aiRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // Route to generate product description
  app.post('/generate-product-description', {
    schema: {
      body: ProductDataSchema,
      response: {
        200: Type.Object({ description: Type.String() }),
      },
    },
  }, async (request, reply) => {
    const { body } = request;
    const description = await aiOrchestrator.generateProductDescription(body);
    return reply.send({ description });
  });

  // Route to process natural language query
  app.post('/process-nl-query', {
    schema: {
      body: NaturalLanguageQuerySchema,
      response: {
        200: Type.Object({
          intent: Type.String(),
          category: Type.Optional(Type.String()),
          priceRange: Type.Optional(Type.Tuple([Type.Number(), Type.Number()])),
          features: Type.Optional(Type.Array(Type.String())),
          sentiment: Type.Optional(Type.String()),
        }),
      },
    },
  }, async (request, reply) => {
    const { query } = request.body;
    const result = await aiOrchestrator.processNaturalLanguageQuery(query);
    return reply.send(result);
  });

  // Route to compare products
  app.post('/compare-products', {
    schema: {
      body: ProductComparisonSchema,
      response: {
        200: Type.Any(), // ProductComparison type is complex, use Type.Any for now
      },
    },
  }, async (request, reply) => {
    const { productIds } = request.body;
    // In a real scenario, you would fetch product details from your DB using productIds
    // For now, we'll use dummy products or assume they are passed in a more complete form
    const dummyProducts: Product[] = productIds.map(id => ({
      id,
      name: `Product ${id}`,
      price: 100,
      categoryId: 'dummy',
      imageUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const comparison = await aiOrchestrator.compareProducts(dummyProducts);
    return reply.send(comparison);
  });

  // Route to generate personalized recommendations
  app.post('/personalized-recommendations', {
    schema: {
      body: PersonalizedRecommendationSchema,
      response: {
        200: Type.Any(), // PersonalizedRecommendation type is complex, use Type.Any for now
      },
    },
  }, async (request, reply) => {
    const { userId, browsingHistory, availableProducts } = request.body;
    const userProfile = { ageGroup: '20s', interests: ['electronics'], averagePurchaseAmount: 500 }; // Dummy user profile
    const recommendations = await aiOrchestrator.generatePersonalizedRecommendation(
      userProfile,
      browsingHistory,
      availableProducts
    );
    return reply.send(recommendations);
  });

  // Route to upsert product embedding
  app.post('/upsert-product-embedding', {
    schema: {
      body: UpsertProductEmbeddingSchema,
      response: {
        200: Type.Object({ success: Type.Boolean() }),
      },
    },
  }, async (request, reply) => {
    const { product, embedding } = request.body;
    await vectorSearchService.upsertProductEmbedding(product, embedding);
    return reply.send({ success: true });
  });

  // Route to search similar products
  app.post('/search-similar-products', {
    schema: {
      body: SearchSimilarProductsSchema,
      response: {
        200: Type.Array(Type.Any()), // Array of Product, use Type.Any for now
      },
    },
  }, async (request, reply) => {
    const { query, filters } = request.body;
    const queryEmbedding = await aiOrchestrator.generateEmbedding(query);
    const similarProducts = await vectorSearchService.searchSimilarProducts(queryEmbedding, filters);
    return reply.send(similarProducts);
  });

  // Route to generate test cases
  app.post('/generate-test-cases', {
    schema: {
      body: GenerateTestCasesSchema,
      response: {
        200: Type.Object({ testCases: Type.Array(Type.Any()) }), // Array of AITestCase, use Type.Any for now
      },
    },
  }, async (request, reply) => {
    const { scenarios } = request.body;
    const testCases = await aiOrchestrator.generateTestScenarios(scenarios);
    return reply.send({ testCases });
  });
}
