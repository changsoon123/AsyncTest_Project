export interface ProductData {
  name: string;
  category: string;
  features: string[];
  price: number;
}

export interface SearchIntent {
  intent: 'product_search' | 'comparison' | 'recommendation';
  category?: string;
  priceRange?: [number, number];
  features?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrls: string[];
  metadata?: any;
    createdAt: string;
    updatedAt: string;
  averageRating?: number; // Added for AI context
}

export interface ProductComparison {
  summary: string;
  bestFor: {
    [key: string]: string; // e.g., "가성비": "제품명"
  };
  pros_cons: {
    [productId: string]: {
      pros: string[];
      cons: string[];
    };
  };
}

export interface UserProfile {
  ageGroup: string;
  interests: string[];
  averagePurchaseAmount: number;
}

export interface BrowsingHistory {
  productName: string;
  categoryName: string;
}

export interface PersonalizedRecommendation {
  recommendations: Array<{
    productId: string;
    reason: string;
    confidence: number;
    category: string;
  }>;
  insights: string;
  nextPurchasePrediction: string;
}
