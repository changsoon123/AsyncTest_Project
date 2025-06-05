import { PineconeClient } from '@pinecone-database/pinecone';
import { Product } from '../types/ai'; // Assuming Product type is defined in ai.d.ts

const pinecone = new PineconeClient();

export class VectorSearchService {
  private index: any; // Pinecone Index instance

  constructor() {
    this.initPinecone();
  }

  private async initPinecone() {
    if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
      console.error('Pinecone environment variables are not set.');
      return;
    }
    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const indexName = 'product-embeddings'; // This should match your Pinecone index name
    this.index = pinecone.Index(indexName);
  }

  async upsertProductEmbedding(product: Product, embedding: number[]): Promise<void> {
    if (!this.index) {
      console.error('Pinecone index not initialized.');
      return;
    }

    const vector = {
      id: product.id,
      values: embedding,
      metadata: {
        productId: product.id,
        categoryId: product.categoryId,
        price: parseFloat(product.price.toString()),
        name: product.name,
        description: product.description || '',
      },
    };

    await this.index.upsert({
      upsertRequest: {
        vectors: [vector],
        namespace: 'products',
      },
    });
  }

  async searchSimilarProducts(
    queryEmbedding: number[],
    filters?: { categoryId?: string; priceRange?: [number, number] }
  ): Promise<Product[]> {
    if (!this.index) {
      console.error('Pinecone index not initialized.');
      return [];
    }

    const filter: any = {};

    if (filters?.categoryId) {
      filter.categoryId = { $eq: filters.categoryId };
    }

    if (filters?.priceRange) {
      filter.price = {
        $gte: filters.priceRange[0],
        $lte: filters.priceRange[1],
      };
    }

    const queryResponse = await this.index.query({
      queryRequest: {
        vector: queryEmbedding,
        topK: 20,
        includeMetadata: true,
        namespace: 'products',
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      },
    });

    return queryResponse.matches?.map((match: any) => ({
      id: match.metadata?.productId,
      score: match.score,
      name: match.metadata?.name,
      description: match.metadata?.description,
      price: match.metadata?.price,
      categoryId: match.metadata?.categoryId,
      imageUrls: [], // Placeholder, as Pinecone metadata might not store all product fields
      createdAt: new Date(), // Placeholder
      updatedAt: new Date(), // Placeholder
      averageRating: undefined, // Placeholder
    })) || [];
  }
}
