# Test info

- Name: 고급 테스트 기능 >> 주문 대시보드 시각적 일관성
- Location: C:\Cline\First_Project\AsyncFlow_Commerce\e2e\ai-edge-cases.spec.ts:124:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveScreenshot(expected)

Locator: locator('.order-timeline')
  Timeout 5000ms exceeded.

Call log:
  - expect.toHaveScreenshot(timeline-component.png) with timeout 5000ms
    - generating new stable screenshot expectation
  - waiting for locator('.order-timeline')
  - Timeout 5000ms exceeded.

    at C:\Cline\First_Project\AsyncFlow_Commerce\e2e\ai-edge-cases.spec.ts:130:51
```

# Page snapshot

```yaml
- main:
  - heading "404" [level=1]
  - heading "This page could not be found." [level=2]
- alert
```

# Test source

```ts
   30 |       await page.fill('[data-testid="email-input"]', 'test@example.com');
   31 |       await page.fill('[data-testid="address-input"]', '123 Test St');
   32 |       await page.click('[data-testid="confirm-order-button"]');
   33 |     } else if (description.includes('메뉴 카테고리 변경')) {
   34 |       await page.click('[data-testid="category-dropdown"]');
   35 |       await page.click('[data-testid="category-electronics"]');
   36 |     } else if (description.includes('로그인')) {
   37 |       await page.fill('[data-testid="email"]', 'test@example.com');
   38 |       await page.fill('[data-testid="password"]', 'password123');
   39 |       await page.click('[data-testid="submit-login"]');
   40 |     } else if (description.includes('장바구니로 이동')) {
   41 |       await page.click('[data-testid="cart-icon"]');
   42 |     } else if (description.includes('결제 페이지로 이동')) {
   43 |       await page.click('[data-testid="checkout-button"]');
   44 |     } else if (description.includes('주문 완료')) {
   45 |       await page.fill('[data-testid="email-input"]', 'test@example.com');
   46 |       await page.fill('[data-testid="name-input"]', '홍길동');
   47 |       await page.fill('[data-testid="address-input"]', '서울시 강남구');
   48 |       await page.click('[data-testid="place-order"]');
   49 |     } else {
   50 |       console.warn(`Unknown auto-playwright action: ${description}`);
   51 |     }
   52 |   } catch (error) {
   53 |     console.error(`Error during auto-playwright action: ${description}`, error);
   54 |   }
   55 | }
   56 |
   57 | interface AITestCase {
   58 |   description: string;
   59 |   setup: (page: Page) => Promise<void>;
   60 |   instructions: string;
   61 |   expectedElement: string;
   62 | }
   63 |
   64 | // Function to generate AI test cases by calling the backend
   65 | async function generateAITestCases(scenarios: string[]): Promise<AITestCase[]> {
   66 |   console.log(`Generating AI test cases for scenarios: ${scenarios.join(', ')} via backend API.`);
   67 |   try {
   68 |     // Assuming a new backend endpoint for generating test cases
   69 |     const response = await axios.post('http://localhost:4000/ai/generate-test-cases', { scenarios });
   70 |     const generatedCases = response.data.testCases;
   71 |
   72 |     console.log('Generated AI Test Cases:', JSON.stringify(generatedCases, null, 2)); // Log the generated test cases
   73 |
   74 |     return generatedCases.map((testCase: any) => ({
   75 |       description: testCase.description,
   76 |       setup: async (page: Page) => {
   77 |         // Execute setup instructions from AI
   78 |         if (testCase.setupInstructions) {
   79 |           console.log(`Navigating to: ${testCase.setupInstructions}`);
   80 |           await page.goto(testCase.setupInstructions);
   81 |         }
   82 |       },
   83 |       instructions: testCase.instructions,
   84 |       expectedElement: testCase.expectedElement,
   85 |     }));
   86 |   } catch (error) {
   87 |     console.error('Error generating AI test cases from backend:', error);
   88 |     // Fallback to a simplified mock if backend call fails
   89 |     return scenarios.map(scenario => ({
   90 |       description: scenario,
   91 |       setup: async (page: Page) => { /* default setup */ },
   92 |       instructions: `Simulated action for: ${scenario}`,
   93 |       expectedElement: 'body',
   94 |     }));
   95 |   }
   96 | }
   97 |
   98 |
   99 | test.describe('AI 기반 엣지 케이스 테스트', () => {
  100 |   test('AI 생성 엣지 케이스 테스트', async ({ page }) => {
  101 |     // GPT-4를 활용한 예상치 못한 시나리오 테스트
  102 |     const edgeCases = await generateAITestCases([
  103 |       '네트워크 연결이 불안정한 상황',
  104 |       '결제 중 브라우저 새로고침',
  105 |       '동일 사용자의 중복 주문',
  106 |       '재고 소진 중 동시 주문'
  107 |     ]);
  108 |
  109 |     for (const scenario of edgeCases) {
  110 |       await test.step(`AI 시나리오: ${scenario.description}`, async () => {
  111 |         await scenario.setup(page);
  112 |         await auto(scenario.instructions, { page });
  113 |         // Using a more robust check for visibility or presence
  114 |         await expect(page.locator(scenario.expectedElement)).toBeVisible({ timeout: 10000 }).catch(() => {
  115 |           console.warn(`Element ${scenario.expectedElement} not visible for scenario: ${scenario.description}`);
  116 |         });
  117 |       });
  118 |     }
  119 |   });
  120 | });
  121 |
  122 | // Additional advanced testing features as outlined in projectbrief.md
  123 | test.describe('고급 테스트 기능', () => {
  124 |   test('주문 대시보드 시각적 일관성', async ({ page }) => {
  125 |     await page.goto('/dashboard');
  126 |     // Mocking auto for test order generation
  127 |     await auto('10개의 테스트 주문 생성', { page });
  128 |     // Visual regression test
  129 |     await expect(page).toHaveScreenshot('dashboard-with-orders.png');
> 130 |     await expect(page.locator('.order-timeline')).toHaveScreenshot('timeline-component.png');
      |                                                   ^ Error: Timed out 5000ms waiting for expect(locator).toHaveScreenshot(expected)
  131 |     console.log('Visual regression test executed.');
  132 |   });
  133 |
  134 |   test('대량 동시 주문 처리 성능', async ({ browser }) => {
  135 |     // Simulate 50 concurrent users
  136 |     const contexts = await Promise.all(
  137 |       Array.from({ length: 50 }, () => browser.newContext())
  138 |     );
  139 |
  140 |     const pages = await Promise.all(
  141 |       contexts.map(context => context.newPage())
  142 |     );
  143 |
  144 |     const startTime = Date.now();
  145 |     await Promise.all(
  146 |       pages.map(async (page, index) => {
  147 |         await auto(`사용자 ${index}의 주문 완료`, { page });
  148 |       })
  149 |     );
  150 |
  151 |     const duration = Date.now() - startTime;
  152 |     expect(duration).toBeLessThan(10000); // Expect within 10 seconds
  153 |
  154 |     await Promise.all(contexts.map(context => context.close()));
  155 |   });
  156 |
  157 |   test('네트워크 요청 패턴 분석', async ({ page }) => {
  158 |     const requests: any[] = [];
  159 |     const responses: any[] = [];
  160 |
  161 |     page.on('request', request => requests.push({
  162 |       url: request.url(),
  163 |       method: request.method(),
  164 |       timestamp: Date.now()
  165 |     }));
  166 |
  167 |     page.on('response', response => responses.push({
  168 |       url: response.url(),
  169 |       status: response.status(),
  170 |       timestamp: Date.now()
  171 |     }));
  172 |
  173 |     await auto('복잡한 주문 프로세스 실행', { page });
  174 |
  175 |     const asyncRequests = requests.filter(req =>
  176 |       req.url.includes('/api/') && req.method === 'POST'
  177 |     );
  178 |
  179 |     expect(asyncRequests.length).toBeGreaterThan(3);
  180 |
  181 |     // Network timing validation
  182 |     const timings = await page.evaluate(() => performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]);
  183 |     expect(timings[0].loadEventEnd - timings[0].fetchStart).toBeLessThan(3000);
  184 |   });
  185 |
  186 |   test('주문 페이지 접근성 검증', async ({ page }) => {
  187 |     await page.goto('/order');
  188 |     await injectAxe(page);
  189 |     // Full page accessibility check
  190 |     await checkA11y(page, undefined, { // Change null to undefined
  191 |       detailedReport: true,
  192 |       detailedReportOptions: { html: true },
  193 |       axeOptions: {
  194 |         rules: {}
  195 |       }
  196 |     });
  197 |     await auto('메뉴 카테고리 변경', { page });
  198 |     // Specific component accessibility check
  199 |     await checkA11y(page, '.menu-items', {
  200 |       axeOptions: { // Wrap rules in axeOptions
  201 |         rules: {
  202 |           'color-contrast': { enabled: true },
  203 |           'keyboard-navigation': { enabled: true }
  204 |         }
  205 |       }
  206 |     });
  207 |   });
  208 | });
  209 |
```