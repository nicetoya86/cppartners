This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 개발 실행

- 요구사항: Node 18+
- 설치:
```bash
npm install
```
- 개발 서버:
```bash
npm run dev
```
- 빌드/실행:
```bash
npm run build && npm start
```

## 기능 개요
- 홈(`src/app/page.tsx`): 쿠팡 URL/이미지 입력 → `/api/search` 호출 → 결과 카드 표시
- API(`src/app/api/search/route.ts`): FormData 기반 POST, 현재 목업 결과 반환(실서비스 로직 연동 예정)

## PRD 문서
- `../docs/prd.md` 참고

## 설정 (.env.local)
다음 환경변수를 필요에 따라 설정하세요.

- XHS 헤드리스 검색(선택):
```
XHS_HEADLESS=1
```
- Supabase 로깅(선택):
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

## Supabase 테이블 예시
다음 SQL로 로그 테이블을 만들 수 있습니다:
```sql
create table if not exists public.search_logs (
  id bigserial primary key,
  created_at timestamptz default now(),
  coupang_url text,
  query text,
  ae_count int not null default 0,
  xhs_count int not null default 0,
  duration_ms int not null default 0
);
```

## XHS 헤드리스 참고
- 로컬에서만 사용 권장. 서버리스 환경(Vercel)에서는 Playwright 지원/런타임 제약을 확인하세요.
- 브라우저 바이너리가 필요하면 다음을 실행:
```bash
npx playwright install
```
