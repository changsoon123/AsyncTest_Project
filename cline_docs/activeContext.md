# 현재 작업 컨텍스트

## 현재 진행 상황
- **현재 스프린트**: Week 2 - 코어 기능 개발
- **오늘의 주요 작업**: 코어 기능 개발 완료
- **작업 중인 기능**: 없음 (Week 2 목표 달성)

## 다음 우선순위 작업
1. **즉시 시작**: 
   - [x] package.json 생성 및 기본 의존성 설치
   - [x] TypeScript 설정 파일 구성
   - [x] 기본 폴더 구조 생성

2. **이번 주 완료 목표**:
   - [x] Node.js + Fastify 백엔드 서버 기본 구조
   - [x] React + Next.js 프론트엔드 기본 구조
   - [x] PostgreSQL + Redis 데이터베이스 연결
   - [x] Jest + Playwright 테스트 환경 설정
   - [x] 사용자 인증: JWT 기반 로그인/회원가입
   - [x] 상품 관리: 상품 CRUD API
   - [x] 장바구니: 실시간 장바구니 기능
   - [x] 기본 검색: 텍스트 기반 상품 검색

## 현재 이슈 및 블로커
- 없음 (Week 2 목표 달성)

## 최근 완료된 작업
- Cline Memory Bank 설정 완료
- 프로젝트 브리프 문서 완성
- 요구사항 명세서(SRS) 작성 완료
- **Week 1 기반 인프라 구축 완료**:
    - `package.json` 및 기본 의존성 설치
    - TypeScript 설정 (`tsconfig.json`)
    - 백엔드/프론트엔드 기본 폴더 구조 생성
    - Fastify 백엔드 서버 기본 구조 (`backend/src/server.ts`)
    - Next.js 프론트엔드 기본 구조 (`frontend/src/app/layout.tsx`, `providers.tsx`, `globals.css`, `page.tsx`)
    - Tailwind CSS 설정 (`frontend/tailwind.config.ts`, `postcss.config.js`)
    - PostgreSQL (Prisma) 및 Redis 연결 설정 (`.env`, `prisma/schema.prisma`, `backend/src/lib/redis.ts`)
    - Jest 테스트 환경 설정 (`jest.config.js`, `jest.setup.js`)
    - Playwright 테스트 환경 설정 (`playwright.config.ts`, `e2e/example.spec.ts`)
- **Week 2 코어 기능 개발 완료**:
    - 사용자 인증 (JWT 기반 로그인/회원가입)
    - 상품 관리 (CRUD API)
    - 장바구니 (실시간 장바구니 기능)
    - 기본 검색 (텍스트 기반 상품 검색)

## 컨텍스트 메모
- LLM 통합 부분은 3-4주차에 집중 예정
- Playwright E2E 테스트는 기본 기능 완료 후 구현
- AI 기반 테스트 생성은 프로젝트 후반부 고급 기능