# Test info

- Name: 고급 테스트 기능 >> 주문 대시보드 시각적 일관성
- Location: C:\Cline\First_Project\AsyncFlow_Commerce\e2e\ai-edge-cases.spec.ts:138:7

# Error details

```
Error: expect(page).toHaveScreenshot(expected)

  1139 pixels (ratio 0.01 of all image pixels) are different.

Expected: C:\Cline\First_Project\AsyncFlow_Commerce\e2e\ai-edge-cases.spec.ts-snapshots\dashboard-with-orders-webkit-win32.png
Received: C:\Cline\First_Project\AsyncFlow_Commerce\test-results\ai-edge-cases-고급-테스트-기능-주문-대시보드-시각적-일관성-webkit\dashboard-with-orders-actual.png
    Diff: C:\Cline\First_Project\AsyncFlow_Commerce\test-results\ai-edge-cases-고급-테스트-기능-주문-대시보드-시각적-일관성-webkit\dashboard-with-orders-diff.png

Call log:
  - expect.toHaveScreenshot(dashboard-with-orders.png) with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 1139 pixels (ratio 0.01 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 1139 pixels (ratio 0.01 of all image pixels) are different.

    at C:\Cline\First_Project\AsyncFlow_Commerce\e2e\ai-edge-cases.spec.ts:143:24
```

# Page snapshot

```yaml
- main:
  - heading "주문 대시보드" [level=1]
  - paragraph: Order timeline content...
- alert
```

# Test source

```ts
   43 |       }
   44 |     } else if (description.includes('사용자')) {
   45 |       await page.goto('/order');
   46 |       await page.fill('[data-testid="user-input"]', description);
   47 |       await page.click('[data-testid="submit-button"]');
   48 |     } else if (description.includes('복잡한 주문 프로세스 실행')) {
   49 |       await page.goto('/checkout');
   50 |       await page.fill('[data-testid="email-input"]', 'test@example.com');
   51 |       await page.fill('[data-testid="address-input"]', '123 Test St');
   52 |       await page.click('[data-testid="confirm-order-button"]');
   53 |     } else if (description.includes('사용자')) {
   54 |       await page.goto('/order');
   55 |       await page.fill('[data-testid="user-input"]', description);
   56 |       await page.click('[data-testid="submit-button"]');
   57 |     } else if (description.includes('사용자')) {
   58 |       // Simulate user specific actions
   59 |       const userIndex = description.match(/사용자 (\d+)/)?.[1];
   60 |       await page.goto('/order');
   61 |       await page.fill('[data-testid="user-input"]', `User ${userIndex}`);
   62 |       await page.click('[data-testid="submit-button"]');
   63 |     } else {
   64 |       console.warn(`Unknown auto-playwright action: ${description}`);
   65 |     }
   66 |   } catch (error) {
   67 |     console.error(`Error during auto-playwright action: ${description}`, error);
   68 |   }
   69 | }
   70 |
   71 | interface AITestCase {
   72 |   description: string;
   73 |   setup: (page: Page) => Promise<void>;
   74 |   instructions: string;
   75 |   expectedElement: string;
   76 | }
   77 |
   78 | // Function to generate AI test cases by calling the backend
   79 | async function generateAITestCases(scenarios: string[]): Promise<AITestCase[]> {
   80 |   console.log(`Generating AI test cases for scenarios: ${scenarios.join(', ')} via backend API.`);
   81 |   try {
   82 |     // Assuming a new backend endpoint for generating test cases
   83 |     const response = await axios.post('http://localhost:4000/ai/generate-test-cases', { scenarios });
   84 |     const generatedCases = response.data.testCases;
   85 |
   86 |     console.log('Generated AI Test Cases:', JSON.stringify(generatedCases, null, 2)); // Log the generated test cases
   87 |
   88 |     return generatedCases.map((testCase: any) => ({
   89 |       description: testCase.description,
   90 |       setup: async (page: Page) => {
   91 |         // Execute setup instructions from AI
   92 |         if (testCase.setupInstructions) {
   93 |           console.log(`Navigating to: ${testCase.setupInstructions}`);
   94 |           await page.goto(testCase.setupInstructions);
   95 |         }
   96 |       },
   97 |       instructions: testCase.instructions,
   98 |       expectedElement: testCase.expectedElement,
   99 |     }));
  100 |   } catch (error) {
  101 |     console.error('Error generating AI test cases from backend:', error);
  102 |     // Fallback to a simplified mock if backend call fails
  103 |     return scenarios.map(scenario => ({
  104 |       description: scenario,
  105 |       setup: async (page: Page) => { /* default setup */ },
  106 |       instructions: `Simulated action for: ${scenario}`,
  107 |       expectedElement: 'body',
  108 |     }));
  109 |   }
  110 | }
  111 |
  112 |
  113 | test.describe('AI 기반 엣지 케이스 테스트', () => {
  114 |   test('AI 생성 엣지 케이스 테스트', async ({ page }) => {
  115 |     // GPT-4를 활용한 예상치 못한 시나리오 테스트
  116 |     const edgeCases = await generateAITestCases([
  117 |       '네트워크 연결이 불안정한 상황',
  118 |       '결제 중 브라우저 새로고침',
  119 |       '동일 사용자의 중복 주문',
  120 |       '재고 소진 중 동시 주문'
  121 |     ]);
  122 |
  123 |     for (const scenario of edgeCases) {
  124 |       await test.step(`AI 시나리오: ${scenario.description}`, async () => {
  125 |         await scenario.setup(page);
  126 |         await auto(scenario.instructions, { page });
  127 |         // Using a more robust check for visibility or presence
  128 |         await expect(page.locator(scenario.expectedElement)).toBeVisible({ timeout: 10000 }).catch(() => {
  129 |           console.warn(`Element ${scenario.expectedElement} not visible for scenario: ${scenario.description}`);
  130 |         });
  131 |       });
  132 |     }
  133 |   });
  134 | });
  135 |
  136 | // Additional advanced testing features as outlined in projectbrief.md
  137 | test.describe('고급 테스트 기능', () => {
  138 |   test('주문 대시보드 시각적 일관성', async ({ page }) => {
  139 |     await page.goto('/dashboard');
  140 |     // Mocking auto for test order generation
  141 |     await auto('10개의 테스트 주문 생성', { page });
  142 |     // Visual regression test
> 143 |     await expect(page).toHaveScreenshot('dashboard-with-orders.png');
      |                        ^ Error: expect(page).toHaveScreenshot(expected)
  144 |     await expect(page.locator('.order-timeline')).toHaveScreenshot('timeline-component.png');
  145 |     console.log('Visual regression test executed.');
  146 |   });
  147 |
  148 |   test('대량 동시 주문 처리 성능', async ({ browser }) => {
  149 |     // Simulate 50 concurrent users
  150 |     const contexts = await Promise.all(
  151 |       Array.from({ length: 50 }, () => browser.newContext())
  152 |     );
  153 |
  154 |     const pages = await Promise.all(
  155 |       contexts.map(context => context.newPage())
  156 |     );
  157 |
  158 |     const startTime = Date.now();
  159 |     await Promise.all(
  160 |       pages.map(async (page, index) => {
  161 |         await auto(`사용자 ${index}의 주문 완료`, { page });
  162 |       })
  163 |     );
  164 |
  165 |     const duration = Date.now() - startTime;
  166 |     expect(duration).toBeLessThan(10000); // Expect within 10 seconds
  167 |
  168 |     await Promise.all(contexts.map(context => context.close()));
  169 |   });
  170 |
  171 |   test('네트워크 요청 패턴 분석', async ({ page }) => {
  172 |     const requests: any[] = [];
  173 |     const responses: any[] = [];
  174 |
  175 |     page.on('request', request => requests.push({
  176 |       url: request.url(),
  177 |       method: request.method(),
  178 |       timestamp: Date.now()
  179 |     }));
  180 |
  181 |     page.on('response', response => responses.push({
  182 |       url: response.url(),
  183 |       status: response.status(),
  184 |       timestamp: Date.now()
  185 |     }));
  186 |
  187 |     await auto('복잡한 주문 프로세스 실행', { page });
  188 |
  189 |     const asyncRequests = requests.filter(req =>
  190 |       req.url.includes('/api/') && req.method === 'POST'
  191 |     );
  192 |
  193 |     expect(asyncRequests.length).toBeGreaterThan(3);
  194 |
  195 |     // Network timing validation
  196 |     const timings = await page.evaluate(() => performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]);
  197 |     expect(timings[0].loadEventEnd - timings[0].fetchStart).toBeLessThan(3000);
  198 |   });
  199 |
  200 |   test('주문 페이지 접근성 검증', async ({ page }) => {
  201 |     await page.goto('/order');
  202 |     await injectAxe(page);
  203 |     // Full page accessibility check
  204 |     await checkA11y(page, undefined, { // Change null to undefined
  205 |       detailedReport: true,
  206 |       detailedReportOptions: { html: true },
  207 |       axeOptions: {
  208 |         rules: {}
  209 |       }
  210 |     });
  211 |     await auto('메뉴 카테고리 변경', { page });
  212 |     // Specific component accessibility check
  213 |     await checkA11y(page, '.menu-items', {
  214 |       axeOptions: { // Wrap rules in axeOptions
  215 |         rules: {
  216 |           'color-contrast': { enabled: true },
  217 |           'keyboard-navigation': { enabled: true }
  218 |         }
  219 |       }
  220 |     });
  221 |   });
  222 | });
  223 |
```