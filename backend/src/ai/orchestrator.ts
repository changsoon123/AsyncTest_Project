import { OpenAIService } from './openai';
import { ClaudeService } from './claude';
import { Product, ProductComparison, UserProfile, BrowsingHistory, PersonalizedRecommendation, ProductData, SearchIntent, AITestCase } from '../types/ai';

interface LLMProvider {
  generateResponse?(prompt: string, context?: any): Promise<string>;
  generateEmbedding?(text: string): Promise<number[]>;
  compareProducts?(products: Product[]): Promise<ProductComparison>;
  generatePersonalizedRecommendation?(
    userProfile: UserProfile,
    browsingHistory: BrowsingHistory[],
    availableProducts: Product[]
  ): Promise<PersonalizedRecommendation>;
  generateProductDescription?(productData: ProductData): Promise<string>;
  processNaturalLanguageQuery?(query: string): Promise<SearchIntent>;
  generateTestScenarios?(scenarios: string[]): Promise<AITestCase[]>; // New method for test case generation
}

export class AIOrchestrator {
  private providers: Map<string, LLMProvider> = new Map();

  constructor() {
    this.providers.set('openai', new OpenAIService());
    this.providers.set('claude', new ClaudeService());
  }

  selectProvider(task: 'recommendation' | 'search' | 'chat' | 'product_description' | 'product_comparison' | 'test_case_generation'): LLMProvider {
    switch (task) {
      case 'recommendation':
        return this.providers.get('claude')!; // Claude for personalized recommendations
      case 'search':
        return this.providers.get('openai')!; // OpenAI for natural language query processing
      case 'chat':
        return this.providers.get('openai')!; // OpenAI for general chat
      case 'product_description':
        return this.providers.get('openai')!; // OpenAI for product descriptions
      case 'product_comparison':
        return this.providers.get('claude')!; // Claude for complex product comparisons
      case 'test_case_generation':
        return this.providers.get('openai')!; // OpenAI for test case generation
      default:
        return this.providers.get('openai')!;
    }
  }

  // Helper methods to call specific LLM functions through the orchestrator
  async generateProductDescription(productData: ProductData): Promise<string> {
    const provider = this.selectProvider('product_description');
    if (provider.generateProductDescription) {
      return provider.generateProductDescription(productData);
    }
    throw new Error('Product description generation not supported by selected provider.');
  }

  async processNaturalLanguageQuery(query: string): Promise<SearchIntent> {
    const provider = this.selectProvider('search');
    if (provider.processNaturalLanguageQuery) {
      return provider.processNaturalLanguageQuery(query);
    }
    throw new Error('Natural language query processing not supported by selected provider.');
  }

  async compareProducts(products: Product[]): Promise<ProductComparison> {
    const provider = this.selectProvider('product_comparison');
    if (provider.compareProducts) {
      return provider.compareProducts(products);
    }
    throw new Error('Product comparison not supported by selected provider.');
  }

  async generatePersonalizedRecommendation(
    userProfile: UserProfile,
    browsingHistory: BrowsingHistory[],
    availableProducts: Product[]
  ): Promise<PersonalizedRecommendation> {
    const provider = this.selectProvider('recommendation');
    if (provider.generatePersonalizedRecommendation) {
      return provider.generatePersonalizedRecommendation(userProfile, browsingHistory, availableProducts);
    }
    throw new Error('Personalized recommendation not supported by selected provider.');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const provider = this.selectProvider('search'); // Embeddings typically used for search/RAG
    if (provider.generateEmbedding) {
      return provider.generateEmbedding(text);
    }
    throw new Error('Embedding generation not supported by selected provider.');
  }

  async generateTestScenarios(scenarios: string[]): Promise<AITestCase[]> {
    const provider = this.selectProvider('test_case_generation');
    if (provider.generateTestScenarios) {
      return provider.generateTestScenarios(scenarios);
    }
    throw new Error('Test case generation not supported by selected provider.');
  }
}
