# systemPatterns.md

```markdown
# AsyncFlow Commerce 시스템 아키텍처 패턴

## 전체 아키텍처 개요

### Headless Commerce + Microservices 하이브리드 아키텍처
5계층 이커머스 아키텍처를 기반으로 한 현대적 설계[^1]

```

┌─────────────────────────────────────────────────────────┐
│ Presentation Layer │
│ (Next.js 14 + React 18 + Mobile Apps + Admin Panel) │
├─────────────────────────────────────────────────────────┤
│ Business Logic Layer │
│ (Fastify + GraphQL + AI Orchestrator) │
├─────────────────────────────────────────────────────────┤
│ Commerce Modules Layer │
│ [Product] [Order] [User] [Payment] [AI-Rec] [Search] │
├─────────────────────────────────────────────────────────┤
│ Best-in-Breed Applications │
│ [PostgreSQL] [Redis] [Pinecone] [Kafka] [S3] │
├─────────────────────────────────────────────────────────┤
│ Third-Party Integration │
│ [Stripe] [SendGrid] [AWS] [OpenAI] [Claude] │
└─────────────────────────────────────────────────────────┘

```

## 핵심 아키텍처 패턴

### 1. Headless Commerce Pattern
프론트엔드와 백엔드 완전 분리로 진정한 옴니채널 구현[^1]

```

// API-First 설계
interface CommerceAPI {
products: ProductService;
orders: OrderService;
users: UserService;
ai: AIService;
}

// 프론트엔드 독립성 보장
class APIClient {
constructor(private baseURL: string) {}

async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
const response = await fetch(`${this.baseURL}${endpoint}`, {
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${this.getToken()}`,
...options?.headers,
},
...options,
});

    return response.json();
    }
}

```

### 2. Modular Monolith Pattern
마이크로서비스 복잡성 없이 모듈화 이점 확보[^2]

```

// 도메인별 모듈 분리
interface ProductModule {
repository: ProductRepository;
service: ProductService;
controller: ProductController;
events: ProductEvents;
}

interface OrderModule {
repository: OrderRepository;
service: OrderService;
controller: OrderController;
events: OrderEvents;
}

// 모듈 간 이벤트 기반 통신
class EventBus {
private handlers = new Map<string, Function[]>();

emit(event: string, data: any) {
const eventHandlers = this.handlers.get(event) || [];
eventHandlers.forEach(handler => handler(data));
}

subscribe(event: string, handler: Function) {
const handlers = this.handlers.get(event) || [];
handlers.push(handler);
this.handlers.set(event, handlers);
}
}

```

### 3. LLM Integration Patterns
AI 기능의 체계적 통합을 위한 설계 패턴[^5]

```

// Strategy Pattern for LLM Selection
interface LLMProvider {
generateResponse(prompt: string, context?: any): Promise<string>;
generateEmbedding(text: string): Promise<number[]>;
}

class OpenAIProvider implements LLMProvider {
async generateResponse(prompt: string, context?: any): Promise<string> {
// OpenAI GPT-4 구현
}

async generateEmbedding(text: string): Promise<number[]> {
// text-embedding-3-large 구현
}
}

class ClaudeProvider implements LLMProvider {
async generateResponse(prompt: string, context?: any): Promise<string> {
// Anthropic Claude 3 구현
}

async generateEmbedding(text: string): Promise<number[]> {
// Claude 임베딩 구현
}
}

// AI Orchestrator Pattern
class AIOrchestrator {
private providers: Map<string, LLMProvider> = new Map();

selectProvider(task: 'recommendation' | 'search' | 'chat'): LLMProvider {
switch (task) {
case 'recommendation':
return this.providers.get('openai')!;
case 'search':
return this.providers.get('claude')!;
case 'chat':
return this.providers.get('openai')!;
default:
return this.providers.get('openai')!;
}
}
}

```

### 4. RAG (Retrieval-Augmented Generation) Pattern
제품 정보 기반 정확한 AI 응답 생성[^5]

```

// Vector Search + LLM Generation
class RAGService {
constructor(
private vectorDB: PineconeClient,
private llmProvider: LLMProvider
) {}

async generateProductRecommendation(query: string, userId: string): Promise<string> {
// 1. 벡터 검색으로 관련 제품 찾기
const queryEmbedding = await this.llmProvider.generateEmbedding(query);
const similarProducts = await this.vectorDB.query({
vector: queryEmbedding,
topK: 5,
filter: { available: true }
});

    // 2. 사용자 히스토리 가져오기
    const userHistory = await this.getUserHistory(userId);
    
    // 3. 컨텍스트와 함께 LLM 응답 생성
    const context = {
      products: similarProducts,
      userHistory,
      query
    };
    
    return await this.llmProvider.generateResponse(
      this.buildPrompt(query),
      context
    );
    }

private buildPrompt(query: string): string {
return `
당신은 전문 쇼핑 어시스턴트입니다.
사용자 질문: \${query}

      제공된 제품 정보와 사용자 히스토리를 바탕으로 
      개인화된 추천을 제공하세요.
    `;
    }
}

```

## 데이터 아키텍처 패턴

### 1. Database Per Domain Pattern
도메인별 데이터베이스 분리로 확장성 확보[^4]

```

// 도메인별 데이터베이스 설계
const DatabaseConfig = {
// 트랜잭션 중요한 데이터
primary: {
host: 'postgresql-primary',
databases: {
users: 'users_db',
orders: 'orders_db',
payments: 'payments_db'
}
},

// 읽기 최적화된 데이터
cache: {
host: 'redis-cluster',
databases: {
products: 'products_cache',
sessions: 'sessions_cache',
search: 'search_cache'
}
},

// 벡터 검색 데이터
vector: {
host: 'pinecone',
indexes: {
products: 'product-embeddings',
reviews: 'review-embeddings'
}
}
};

```

### 2. Event Sourcing Pattern
주문 상태 변화 추적 및 복구 가능성 보장

```

// 이벤트 기반 상태 관리
interface OrderEvent {
id: string;
orderId: string;
eventType: 'CREATED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
payload: any;
timestamp: Date;
userId: string;
}

class OrderEventStore {
private events: OrderEvent[] = [];

async append(event: OrderEvent): Promise<void> {
this.events.push(event);
await this.persistEvent(event);
await this.publishEvent(event);
}

async getOrderHistory(orderId: string): Promise<OrderEvent[]> {
return this.events.filter(event => event.orderId === orderId);
}

async rebuildOrderState(orderId: string): Promise<Order> {
const events = await this.getOrderHistory(orderId);
return events.reduce((order, event) => {
return this.applyEvent(order, event);
}, new Order());
}
}

```

## 프론트엔드 아키텍처 패턴

### 1. Layered Architecture in Next.js
백엔드 구조와 일치하는 프론트엔드 레이어링[^3]

```

// 계층별 책임 분리
interface FrontendLayers {
presentation: {
components: React.ComponentType[];
pages: React.ComponentType[];
layouts: React.ComponentType[];
};

business: {
hooks: CustomHook[];
stores: ZustandStore[];
services: BusinessService[];
};

data: {
api: APIClient;
cache: QueryClient;
validation: ZodSchema[];
};
}

// Entity vs Process 패턴
class ProductEntity {
// 단일 엔티티 관련 로직
static async fetchProduct(id: string): Promise<Product> {}
static async updateProduct(id: string, data: UpdateProductData): Promise<Product> {}
}

class CheckoutProcess {
// 복잡한 다중 엔티티 워크플로우
static async processOrder(items: CartItem[]): Promise<Order> {
const validatedItems = await this.validateItems(items);
const calculatedPrices = await this.calculatePrices(validatedItems);
const processedPayment = await this.processPayment(calculatedPrices);
return await this.createOrder(processedPayment);
}
}

```

### 2. State Management Pattern
Redux Toolkit과 Zustand 하이브리드 접근[^3]

```

// 복잡한 상태: RTK Query
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ecommerceApi = createApi({
reducerPath: 'ecommerceApi',
baseQuery: fetchBaseQuery({
baseUrl: '/api/',
prepareHeaders: (headers, { getState }) => {
const token = (getState() as RootState).auth.token;
if (token) headers.set('authorization', `Bearer ${token}`);
return headers;
},
}),
tagTypes: ['Product', 'Order', 'User'],
endpoints: (builder) => ({
getProducts: builder.query<Product[], ProductFilters>({
query: (filters) => `products?${new URLSearchParams(filters)}`,
providesTags: ['Product'],
}),
}),
});

// 간단한 상태: Zustand
interface AppState {
cart: CartItem[];
user: User | null;
theme: 'light' | 'dark';

// Actions
addToCart: (item: CartItem) => void;
removeFromCart: (itemId: string) => void;
setUser: (user: User | null) => void;
toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
cart: [],
user: null,
theme: 'light',

addToCart: (item) => set((state) => ({
cart: [...state.cart, item]
})),

removeFromCart: (itemId) => set((state) => ({
cart: state.cart.filter(item => item.id !== itemId)
})),

setUser: (user) => set({ user }),

toggleTheme: () => set((state) => ({
theme: state.theme === 'light' ? 'dark' : 'light'
})),
}));

```

## 테스트 아키텍처 패턴

### 1. Test Pyramid Pattern
효율적인 테스트 전략[^4]

```

// 테스트 계층별 구성
const TestStrategy = {
unit: {
coverage: '80%',
tools: ['Jest', 'React Testing Library'],
focus: ['Services', 'Utils', 'Hooks']
},

integration: {
coverage: '15%',
tools: ['Jest', 'Supertest', 'MSW'],
focus: ['API Routes', 'Database Operations']
},

e2e: {
coverage: '5%',
tools: ['Playwright', 'Auto-Playwright'],
focus: ['Critical User Journeys', 'Cross-browser']
}
};

// Page Object Model Pattern
class ProductPageObject {
constructor(private page: Page) {}

async selectProduct(productName: string) {
await this.page.click(`[data-testid="product-${productName}"]`);
}

async addToCart() {
await this.page.click('[data-testid="add-to-cart"]');
await this.page.waitForSelector('[data-testid="cart-updated"]');
}

async getPrice(): Promise<string> {
return await this.page.textContent('[data-testid="product-price"]') || '';
}
}

```

## 보안 및 성능 패턴

### 1. Circuit Breaker Pattern
외부 서비스 장애 대응

```

class CircuitBreaker {
private failureCount = 0;
private lastFailureTime = 0;
private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

constructor(
private threshold: number = 5,
private timeout: number = 60000
) {}

async execute<T>(operation: () => Promise<T>): Promise<T> {
if (this.state === 'OPEN') {
if (Date.now() - this.lastFailureTime < this.timeout) {
throw new Error('Circuit breaker is OPEN');
}
this.state = 'HALF_OPEN';
}

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
    }

private onSuccess() {
this.failureCount = 0;
this.state = 'CLOSED';
}

private onFailure() {
this.failureCount++;
this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
    }
}

```

### 2. Rate Limiting Pattern
API 보호 및 공정한 사용량 관리

```

class RateLimiter {
private requests = new Map<string, number[]>();

constructor(
private maxRequests: number = 100,
private windowMs: number = 60000
) {}

isAllowed(identifier: string): boolean {
const now = Date.now();
const windowStart = now - this.windowMs;

    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
    }
}

```