import OpenAI from 'openai';
import { ProductData, SearchIntent, AITestCase } from '../types/ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

export class OpenAIService {
  async generateProductDescription(productData: ProductData): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `당신은 전문 제품 설명 작성자입니다. 주어진 제품 정보를 바탕으로 매력적이고 정확한 설명을 작성하세요.`,
        },
        {
          role: 'user',
          content: `제품명: ${productData.name} 카테고리: ${productData.category} 특징: ${productData.features.join(', ')} 가격: ${productData.price}원`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.1,
    });

    return completion.choices[0].message.content || '';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536, // 비용 최적화를 위한 차원 축소
    });

    return response.data[0].embedding;
  }

  async processNaturalLanguageQuery(query: string): Promise<SearchIntent> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `사용자의 자연어 검색 쿼리를 분석하여 구조화된 검색 의도를 추출하세요. 결과는 JSON 형태로 반환하세요.`,
        },
        {
          role: 'user',
          content: `검색 쿼리: "${query}"

                   다음 형태로 분석해주세요:
                   {
                     "intent": "product_search | comparison | recommendation",
                     "category": "카테고리명",
                     "priceRange": [최소가격, 최대가격],
                     "features": ["특징1", "특징2"],
                     "sentiment": "positive | neutral | negative"
                   }`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  async generateTestScenarios(scenarios: string[]): Promise<AITestCase[]> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `주어진 시나리오 설명을 바탕으로 Playwright E2E 테스트 케이스를 위한 구조화된 JSON 데이터를 생성하세요. 각 테스트 케이스는 'description', 'setupInstructions' (선택 사항, 테스트 시작 전 이동해야 하는 URL), 'instructions' (auto-playwright에 전달될 지시), 'expectedElement' (기대되는 UI 요소의 data-testid 또는 CSS 선택자)를 포함해야 합니다.`,
        },
        {
          role: 'user',
          content: `다음 시나리오에 대한 테스트 케이스를 생성하세요:
${scenarios.map(s => `- ${s}`).join('\n')}

결과는 다음 JSON 배열 형태로 반환하세요:
[
  {
    "description": "시나리오 설명",
    "setupInstructions": "테스트 시작 전 이동해야 하는 URL (예: '/order')",
    "instructions": "auto-playwright instructions",
    "expectedElement": "data-testid or CSS selector"
  }
]`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    try {
      const content = completion.choices[0].message.content;
      if (content) {
        const parsedContent = JSON.parse(content);
        // Ensure it's an array and each item matches AITestCase structure
        if (Array.isArray(parsedContent)) {
          return parsedContent.map(item => ({
            description: item.description || '',
            setupInstructions: item.setupInstructions,
            instructions: item.instructions || '',
            expectedElement: item.expectedElement || 'body', // Default to body if not provided
          })) as AITestCase[];
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to parse AI generated test cases:', error);
      return [];
    }
  }
}
