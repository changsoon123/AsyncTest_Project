# techContext.md

```markdown
# AsyncFlow Commerce 기술 스택 상세 컨텍스트

## 백엔드 기술 스택

### Node.js 18+ Runtime Environment
LTS 버전 기반 안정성과 최신 기능 활용

```

{
"engines": {
"node": ">=18.17.0",
"npm": ">=9.6.0"
},
"volta": {
"node": "18.18.2",
"npm": "9.8.1"
}
}

```

**주요 특징**:
- ES2022 지원 (Top-level await, Private fields)
- V8 엔진 최적화
- Native Test Runner 내장
- Experimental Fetch API

### Fastify Framework
Express.js 대비 2배 빠른 성능의 웹 프레임워크[^2]

```

import Fastify, { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

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

// 플러그인 등록
await app.register(import('@fastify/helmet'));
await app.register(import('@fastify/cors'), {
origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization'],
});

// GraphQL 통합
await app.register(import('mercurius'), {
schema: graphqlSchema,
resolvers: graphqlResolvers,
graphiql: process.env.NODE_ENV === 'development',
ide: process.env.NODE_ENV === 'development',
path: '/api/graphql',
context: async (request) => ({
user: request.user,
dataSources: {
productAPI: new ProductAPI(),
userAPI: new UserAPI(),
},
}),
});

```

**성능 최적화**:
- JSON 스키마 기반 직렬화
- 내장 요청 검증
- Zero-overhead 플러그인 시스템
- HTTP/2 지원

### GraphQL + Apollo Federation
마이크로서비스 간 효율적 데이터 페칭

```

// 통합 스키마 정의
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'apollo-server-fastify';

const typeDefs = gql`
extend type Query {
products(filters: ProductFilters): [Product!]!
product(id: ID!): Product
}

extend type Mutation {
addProduct(input: AddProductInput!): Product!
updateProduct(id: ID!, input: UpdateProductInput!): Product!
}

type Product @key(fields: "id") {
id: ID!
name: String!
description: String
price: Float!
category: Category!
reviews: [Review!]!
recommendations: [Product!]! @requires(fields: "category { id }")
}

input ProductFilters {
categoryId: ID
priceRange: PriceRangeInput
rating: Float
availability: Boolean
}
`;

const resolvers = {
Query: {
products: async (_, { filters }, { dataSources }) => {
return dataSources.productAPI.getProducts(filters);
},
product: async (_, { id }, { dataSources }) => {
return dataSources.productAPI.getProduct(id);
},
},

Product: {
__resolveReference: async (reference, { dataSources }) => {
return dataSources.productAPI.getProduct(reference.id);
},

    recommendations: async (product, _, { dataSources }) => {
      return dataSources.aiAPI.getRecommendations(product.id);
    },
    },
};

export const schema = buildSubgraphSchema({ typeDefs, resolvers });

```

### 데이터베이스 아키텍처

#### PostgreSQL 14+ with Prisma ORM
타입 안전성과 성능을 보장하는 데이터 계층

```

// schema.prisma
generator client {
provider = "prisma-client-js"
binaryTargets = ["native", "debian-openssl-3.0.x"]
}

datasource db {
provider = "postgresql"
url      = env("DATABASE_URL")
}

model User {
id        String   @id @default(cuid())
email     String   @unique
name      String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

orders    Order[]
reviews   Review[]
cart      CartItem[]

@@map("users")
}

model Product {
id          String   @id @default(cuid())
name        String
description String?
price       Decimal  @db.Decimal(10, 2)
categoryId  String
imageUrls   String[]
metadata    Json?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt

category    Category @relation(fields: [categoryId], references: [id])
orderItems  OrderItem[]
reviews     Review[]
cartItems   CartItem[]

@@index([categoryId])
@@index([price])
@@map("products")
}

model Order {
id          String      @id @default(cuid())
userId      String
status      OrderStatus @default(PENDING)
totalAmount Decimal     @db.Decimal(10, 2)
createdAt   DateTime    @default(now())
updatedAt   DateTime    @updatedAt

user        User        @relation(fields: [userId], references: [id])
items       OrderItem[]
events      OrderEvent[]

@@index([userId])
@@index([status])
@@map("orders")
}

enum OrderStatus {
PENDING
PAID
PROCESSING
SHIPPED
DELIVERED
CANCELLED
}

```

#### Redis 7+ Caching Strategy
다층 캐싱으로 성능 최적화

```

import Redis from 'ioredis';

const redis = new Redis({
host: process.env.REDIS_HOST || 'localhost',
port: parseInt(process.env.REDIS_PORT || '6379'),
password: process.env.REDIS_PASSWORD,
retryDelayOnFailover: 100,
maxRetriesPerRequest: 3,
enableReadyCheck: true,
maxLoadingTimeout: 1000,
});

// 캐싱 전략 정의
export const CacheStrategy = {
// 자주 변경되지 않는 데이터
PRODUCT_DETAILS: {
ttl: 3600, // 1시간
keyPattern: 'product:details:{id}',
},

// 사용자별 개인화 데이터
USER_RECOMMENDATIONS: {
ttl: 1800, // 30분
keyPattern: 'user:recommendations:{userId}',
},

// 검색 결과
SEARCH_RESULTS: {
ttl: 900, // 15분
keyPattern: 'search:{query}:{filters}',
},

// 세션 데이터
USER_SESSION: {
ttl: 86400, // 24시간
keyPattern: 'session:{sessionId}',
},
};

class CacheService {
async get<T>(key: string): Promise<T | null> {
const cached = await redis.get(key);
return cached ? JSON.parse(cached) : null;
}

async set(key: string, value: any, ttl?: number): Promise<void> {
const serialized = JSON.stringify(value);
if (ttl) {
await redis.setex(key, ttl, serialized);
} else {
await redis.set(key, serialized);
}
}

async invalidatePattern(pattern: string): Promise<void> {
const keys = await redis.keys(pattern);
if (keys.length > 0) {
await redis.del(...keys);
}
}
}

```

#### Pinecone Vector Database
AI 기반 유사도 검색을 위한 벡터 저장소

```

import { PineconeClient } from '@pinecone-database/pinecone';

const pinecone = new PineconeClient();
await pinecone.init({
environment: process.env.PINECONE_ENVIRONMENT!,
apiKey: process.env.PINECONE_API_KEY!,
});

// 인덱스 설정
const indexName = 'product-embeddings';
const index = pinecone.Index(indexName);

interface ProductVector {
id: string;
values: number[];
metadata: {
productId: string;
categoryId: string;
price: number;
name: string;
description: string;
};
}

class VectorSearchService {
async upsertProductEmbedding(product: Product, embedding: number[]): Promise<void> {
const vector: ProductVector = {
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

    await index.upsert({
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
const filter: any = {};

    if (filters?.categoryId) {
      filter.categoryId = { $eq: filters.categoryId };
    }
    
    if (filters?.priceRange) {
      filter.price = {
        $gte: filters.priceRange,
        $lte: filters.priceRange[^1],
      };
    }
    
    const queryResponse = await index.query({
      queryRequest: {
        vector: queryEmbedding,
        topK: 20,
        includeMetadata: true,
        namespace: 'products',
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      },
    });
    
    return queryResponse.matches?.map(match => ({
      id: match.metadata?.productId,
      score: match.score,
      ...match.metadata,
    })) || [];
    }
}

```

## AI/LLM 통합 기술

### OpenAI GPT-4 Integration
상품 추천 및 자연어 처리

```

import OpenAI from 'openai';

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
organization: process.env.OPENAI_ORG_ID,
});

class OpenAIService {
async generateProductDescription(productData: ProductData): Promise<string> {
const completion = await openai.chat.completions.create({
model: 'gpt-4-turbo-preview',
messages: [
{
role: 'system',
content: `당신은 전문 제품 설명 작성자입니다.                     주어진 제품 정보를 바탕으로 매력적이고 정확한 설명을 작성하세요.`,
},
{
role: 'user',
content: `제품명: ${productData.name}                    카테고리: ${productData.category}                    특징: ${productData.features.join(', ')}                    가격: ${productData.price}원`,
},
],
temperature: 0.7,
max_tokens: 500,
presence_penalty: 0.1,
});

    return completion.choices.message.content || '';
    }

async generateEmbedding(text: string): Promise<number[]> {
const response = await openai.embeddings.create({
model: 'text-embedding-3-large',
input: text,
dimensions: 1536, // 비용 최적화를 위한 차원 축소
});

    return response.data.embedding;
    }

async processNaturalLanguageQuery(query: string, context: any): Promise<SearchIntent> {
const completion = await openai.chat.completions.create({
model: 'gpt-4-turbo-preview',
messages: [
{
role: 'system',
content: `사용자의 자연어 검색 쿼리를 분석하여 구조화된 검색 의도를 추출하세요.                    결과는 JSON 형태로 반환하세요.`,
},
{
role: 'user',
content: `검색 쿼리: "\${query}"

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
    
    return JSON.parse(completion.choices.message.content || '{}');
    }
}

```

### Anthropic Claude 3 Integration
복잡한 상품 비교 및 분석

```

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
apiKey: process.env.ANTHROPIC_API_KEY,
});

class ClaudeService {
async compareProducts(products: Product[]): Promise<ProductComparison> {
const message = await anthropic.messages.create({
model: 'claude-3-sonnet-20240229',
max_tokens: 1000,
temperature: 0.3,
messages: [
{
role: 'user',
content: `다음 제품들을 비교 분석해주세요:                    ${products.map(p => `
제품명: \${p.name}
가격: \${p.price}원
설명: \${p.description}
리뷰 평점: \${p.averageRating}
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
    
    return JSON.parse(message.content.text);
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
    
    return JSON.parse(message.content.text);
    }
}

```

## 프론트엔드 기술 스택

### Next.js 14 + App Router
React 기반 풀스택 프레임워크

```

// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
title: 'AsyncFlow Commerce',
description: 'AI-powered e-commerce platform',
icons: {
icon: '/favicon.ico',
},
};

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<html lang="ko" className={inter.className}>
<body className="min-h-screen bg-background font-sans antialiased">
<Providers>
<div className="relative flex min-h-screen flex-col">
<Navigation />
<main className="flex-1">{children}</main>
<Footer />
</div>
</Providers>
</body>
</html>
);
}

// app/products/[id]/page.tsx
import { Suspense } from 'react';
import { ProductDetail } from '@/components/ProductDetail';
import { RelatedProducts } from '@/components/RelatedProducts';
import { ProductSkeleton } from '@/components/skeletons/ProductSkeleton';

interface ProductPageProps {
params: { id: string };
searchParams: { variant?: string };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
return (
<div className="container mx-auto px-4 py-8">
<Suspense fallback={<ProductSkeleton />}>
<ProductDetail productId={params.id} variant={searchParams.variant} />
</Suspense>

      <Suspense fallback={<div>관련 상품 로딩중...</div>}>
        <RelatedProducts productId={params.id} />
      </Suspense>
    </div>
    );
}

// 서버 컴포넌트에서 데이터 페칭
async function getProduct(id: string) {
const res = await fetch(`${process.env.API_URL}/api/products/${id}`, {
next: { revalidate: 300 }, // 5분 캐시
});

if (!res.ok) {
throw new Error('Failed to fetch product');
}

return res.json();
}

```

### React 18 + Concurrent Features
최신 React 기능 활용

```

import {
useTransition,
useDeferredValue,
startTransition,
use
} from 'react';

// 검색 컴포넌트에서 동시성 기능 활용
function ProductSearch() {
const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();
const deferredQuery = useDeferredValue(query);

const handleSearch = (newQuery: string) => {
setQuery(newQuery);

    // 검색은 우선순위가 낮은 업데이트로 처리
    startTransition(() => {
      // 검색 로직
    });
    };

return (
<div>
<input
type="text"
value={query}
onChange={(e) => handleSearch(e.target.value)}
placeholder="상품 검색..."
/>

      {isPending && <SearchSpinner />}
      
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults query={deferredQuery} />
      </Suspense>
    </div>
    );
}

// Suspense 기반 데이터 페칭
function SearchResults({ query }: { query: string }) {
// use Hook으로 비동기 데이터 사용
const results = use(searchProducts(query));

return (
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
{results.map(product => (
<ProductCard key={product.id} product={product} />
))}
</div>
);
}

```

### Zustand State Management
가벼운 전역 상태 관리

```

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartItem {
id: string;
productId: string;
quantity: number;
price: number;
name: string;
imageUrl: string;
}

interface AppState {
// State
user: User | null;
cart: CartItem[];
wishlist: string[];
theme: 'light' | 'dark';
searchHistory: string[];

// Actions
setUser: (user: User | null) => void;
addToCart: (item: Omit<CartItem, 'id'>) => void;
removeFromCart: (itemId: string) => void;
updateCartQuantity: (itemId: string, quantity: number) => void;
clearCart: () => void;

toggleWishlist: (productId: string) => void;
setTheme: (theme: 'light' | 'dark') => void;
addSearchHistory: (query: string) => void;
}

export const useAppStore = create<AppState>()(
subscribeWithSelector(
immer((set, get) => ({
// Initial state
user: null,
cart: [],
wishlist: [],
theme: 'light',
searchHistory: [],

      // Actions
      setUser: (user) => set({ user }),
      
      addToCart: (item) => set((state) => {
        const existingItem = state.cart.find(i => i.productId === item.productId);
        
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          state.cart.push({
            id: crypto.randomUUID(),
            ...item,
          });
        }
      }),
      
      removeFromCart: (itemId) => set((state) => {
        state.cart = state.cart.filter(item => item.id !== itemId);
      }),
      
      updateCartQuantity: (itemId, quantity) => set((state) => {
        const item = state.cart.find(i => i.id === itemId);
        if (item) {
          if (quantity <= 0) {
            state.cart = state.cart.filter(i => i.id !== itemId);
          } else {
            item.quantity = quantity;
          }
        }
      }),
      
      clearCart: () => set((state) => {
        state.cart = [];
      }),
      
      toggleWishlist: (productId) => set((state) => {
        const index = state.wishlist.indexOf(productId);
        if (index > -1) {
          state.wishlist.splice(index, 1);
        } else {
          state.wishlist.push(productId);
        }
      }),
      
      setTheme: (theme) => set({ theme }),
      
      addSearchHistory: (query) => set((state) => {
        if (!state.searchHistory.includes(query)) {
          state.searchHistory.unshift(query);
          // 최대 10개 유지
          if (state.searchHistory.length > 10) {
            state.searchHistory.pop();
          }
        }
      }),
    }))
    )
);

// 로컬 스토리지 동기화
useAppStore.subscribe(
(state) => state.cart,
(cart) => {
localStorage.setItem('cart', JSON.stringify(cart));
}
);

useAppStore.subscribe(
(state) => state.theme,
(theme) => {
localStorage.setItem('theme', theme);
document.documentElement.setAttribute('data-theme', theme);
}
);

```

## 테스트 기술 스택

### Jest + Testing Library
단위 및 통합 테스트

```

// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
dir: './',
});

const customJestConfig = {
setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
testEnvironment: 'jest-environment-jsdom',
moduleNameMapping: {
'^@/(.*)\$': '<rootDir>/src/\$1',
},
collectCoverageFrom: [
'src/**/*.{js,jsx,ts,tsx}',
'!src/**/*.d.ts',
'!src/**/*.stories.{js,jsx,ts,tsx}',
],
coverageThreshold: {
global: {
branches: 85,
functions: 85,
lines: 85,
statements: 85,
},
},
testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);

// 컴포넌트 테스트 예시
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAppStore } from '@/store/useAppStore';
import { ProductCard } from '@/components/ProductCard';

// Zustand 스토어 모킹
jest.mock('@/store/useAppStore');

describe('ProductCard', () => {
const mockProduct = {
id: '1',
name: '테스트 제품',
price: 10000,
imageUrl: '/test-image.jpg',
averageRating: 4.5,
};

const mockAddToCart = jest.fn();
const mockToggleWishlist = jest.fn();

beforeEach(() => {
(useAppStore as jest.Mock).mockReturnValue({
addToCart: mockAddToCart,
toggleWishlist: mockToggleWishlist,
wishlist: [],
});
});

it('제품 정보를 올바르게 렌더링한다', () => {
render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('테스트 제품')).toBeInTheDocument();
    expect(screen.getByText('10,000원')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/test-image.jpg');
    });

it('장바구니 추가 버튼 클릭 시 addToCart를 호출한다', async () => {
render(<ProductCard product={mockProduct} />);

    const addToCartButton = screen.getByRole('button', { name: /장바구니 추가/i });
    fireEvent.click(addToCartButton);
    
    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith({
        productId: '1',
        name: '테스트 제품',
        price: 10000,
        quantity: 1,
        imageUrl: '/test-image.jpg',
      });
    });
    });
});

```

### Playwright E2E Testing
크로스 브라우저 종단간 테스트

```

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
testDir: './e2e',
fullyParallel: true,
forbidOnly: !!process.env.CI,
retries: process.env.CI ? 2 : 0,
workers: process.env.CI ? 1 : undefined,

reporter: [
['html', { outputFolder: 'playwright-report' }],
['json', { outputFile: 'test-results.json' }],
['junit', { outputFile: 'test-results.xml' }],
],

use: {
baseURL: process.env.BASE_URL || 'http://localhost:3000',
trace: 'on-first-retry',
screenshot: 'only-on-failure',
video: 'retain-on-failure',
},

projects: [
{
name: 'chromium',
use: { ...devices['Desktop Chrome'] },
},
{
name: 'firefox',
use: { ...devices['Desktop Firefox'] },
},
{
name: 'webkit',
use: { ...devices['Desktop Safari'] },
},
{
name: 'Mobile Chrome',
use: { ...devices['Pixel 5'] },
},
{
name: 'Mobile Safari',
use: { ...devices['iPhone 12'] },
},
],

webServer: {
command: 'npm run dev',
port: 3000,
reuseExistingServer: !process.env.CI,
},
});

// E2E 테스트 예시
import { test, expect } from '@playwright/test';

test.describe('전체 구매 프로세스', () => {
test('상품 검색부터 주문 완료까지', async ({ page }) => {
// 홈페이지 접속
await page.goto('/');

    // 상품 검색
    await page.fill('[data-testid="search-input"]', '노트북');
    await page.click('[data-testid="search-button"]');
    
    // 검색 결과 확인
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    
    // 첫 번째 상품 클릭
    await page.click('[data-testid="product-card"]:first-child');
    
    // 상품 상세 페이지 확인
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    
    // 장바구니 추가
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();
    
    // 장바구니 페이지로 이동
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-items"]')).toBeVisible();
    
    // 결제 페이지로 이동
    await page.click('[data-testid="checkout-button"]');
    
    // 결제 정보 입력
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="name-input"]', '홍길동');
    await page.fill('[data-testid="address-input"]', '서울시 강남구');
    
    // 결제 완료
    await page.click('[data-testid="place-order"]');
    
    // 주문 완료 페이지 확인
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toContainText(/ORD-\d+/);
    });

test('AI 추천 기능', async ({ page }) => {
await page.goto('/');

    // 로그인
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit-login"]');
    
    // AI 추천 섹션 확인
    await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
    
    // 추천 이유 확인
    const recommendationCards = page.locator('[data-testid="recommendation-card"]');
    await expect(recommendationCards).toHaveCountGreaterThan(0);
    
    // 첫 번째 추천 상품의 이유 확인
    await expect(
      recommendationCards.first().locator('[data-testid="recommendation-reason"]')
    ).toBeVisible();
    });
});

```