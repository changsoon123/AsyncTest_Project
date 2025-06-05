import OpenAI from 'openai';
import { ProductData, SearchIntent } from '../types/ai'; // Assuming these types will be defined

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
}
