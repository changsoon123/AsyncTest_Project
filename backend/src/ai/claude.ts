import Anthropic from '@anthropic-ai/sdk';
import { Product, ProductComparison, UserProfile, BrowsingHistory, PersonalizedRecommendation } from '../types/ai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class ClaudeService {
  async compareProducts(products: Product[]): Promise<ProductComparison> {
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `다음 제품들을 비교 분석해주세요: ${products.map(p => `
제품명: ${p.name}
가격: ${p.price}원
설명: ${p.description}
리뷰 평점: ${p.averageRating}
`).join('\n---\n')}

                   비교 결과를 JSON 형태로 제공해주세요:
                   {
                     "summary": "전체 비교 요약",
                     "bestFor": {
                       "가성비": "제품명",
                       "품질": "제품명",
                       "인기도": "제품명"
                     },
                     "pros_cons": {
                       "제품ID": {
                         "pros": ["장점1", "장점2"],
                         "cons": ["단점1", "단점2"]
                       }
                     }
                   }`,
        },
      ],
    });

    const textContent = message.content.find(block => block.type === 'text');
    return JSON.parse(textContent?.text || '{}');
  }

  async generatePersonalizedRecommendation(
    userProfile: UserProfile,
    browsingHistory: BrowsingHistory[],
    availableProducts: Product[]
  ): Promise<PersonalizedRecommendation> {
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: `사용자 프로필과 구매 이력을 분석하여 개인화된 추천을 생성하세요:

                   사용자 정보:
                   - 연령대: ${userProfile.ageGroup}
                   - 관심 카테고리: ${userProfile.interests.join(', ')}
                   - 평균 구매 금액: ${userProfile.averagePurchaseAmount}원
                   
                   최근 구매 이력:
                   ${browsingHistory.map(h => `- ${h.productName} (${h.categoryName})`).join('\n')}
                   
                   추천 가능한 제품들:
                   ${availableProducts.slice(0, 20).map(p => 
                     `- ${p.name} (${p.price}원, 평점: ${p.averageRating})`
                   ).join('\n')}
                   
                   다음 형태로 추천 결과를 제공해주세요:
                   {
                     "recommendations": [
                       {
                         "productId": "ID",
                         "reason": "추천 이유",
                         "confidence": 0.9,
                         "category": "카테고리"
                       }
                     ],
                     "insights": "사용자 구매 패턴 분석",
                     "nextPurchasePrediction": "다음 구매 예상 시기"
                   }`,
        },
      ],
    });

    const textContent = message.content.find(block => block.type === 'text');
    return JSON.parse(textContent?.text || '{}');
  }
}
