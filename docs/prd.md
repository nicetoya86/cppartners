## 웹사이트 PRD: 쿠팡 상품의 샤오홍슈/알리익스프레스 등록 여부 확인 서비스

- **쿠팡**: [`https://www.coupang.com/`](https://www.coupang.com/)
- **샤오홍슈**: [`https://www.xiaohongshu.com/`](https://www.xiaohongshu.com/)
- **알리익스프레스**: [`https://ko.aliexpress.com/`](https://ko.aliexpress.com/)

### 1) 개요/목표
- 문제: 쿠팡에 판매 중인 상품이 샤오홍슈/알리익스프레스에도 등록되어 있는지 빠르게 확인하기 어려움.
- 해결: 쿠팡 상품 URL(또는 이미지)을 입력하면, 샤오홍슈/알리익스프레스에서 동일/유사 상품을 탐지하고, 존재할 경우 각 플랫폼의 상품 URL을 제공.
- 핵심 규칙: 둘 중 하나라도 발견되면 해당 URL 제공. 둘 다 없으면 URL을 제공하지 않음.

### 2) 범위
- 포함: 쿠팡 URL 파싱/이미지 확보, 샤오홍슈·알리익스프레스 탐색, URL 결과 제공, 직관적 UI, 사용자 친화적 인터랙션, Tailwind 기반 스타일 가이드(Windtail 표기).
- 제외: 구매/결제 기능, 로그인, 장바구니 등 전자상거래 기능.

### 3) 사용자 스토리
- 셀러/MD: 타 채널 노출 여부 확인 → 가격/콘텐츠 전략 수립
- 마케터: 샤오홍슈 확산 여부 파악 → 캠페인 전략 수립
- 운영자: 병행수입/브랜드 관리 리스크 탐지
- 시나리오: "쿠팡 URL/이미지 입력 → 검색 → 각 플랫폼 URL 제공(있을 때만)"

### 4) KPI
- 검색 성공률, 잘못된 매칭률(≤5%), P95 응답시간 < 3s, 첫 결과 < 2s

### 5) 기능 요구사항
- 입력: 쿠팡 URL 입력란, 이미지 업로드(드래그&드롭), URL/이미지 중 하나 필수
- 쿠팡 파싱: URL 유효성, 상품 ID/슬러그, 대표 이미지, 상품명/브랜드/옵션 추출
- 매칭 탐색: 샤오홍슈/알리익스프레스 대상, 이미지 해시(pHash/aHash)+텍스트(제목/브랜드)
- 결과: 발견된 플랫폼의 URL만 제공. 둘 다 미발견이면 URL 미표시 + 안내
- 상태/오류: 로딩 스켈레톤, 부분 결과 점진 노출, 타임아웃/백오프, 명확 오류 메시지

### 6) 비기능 요구사항
- 성능: P95 < 3s, 비동기/캐시
- 확장성: 워커 수평 확장
- 보안: 입력 검증, SSRF 차단, 타임/메모리 제한, robots/약관 준수
- 접근성: 키보드 내비/ARIA
- 국제화: 한글 우선, 다국어 확장 고려
- 로깅/모니터링: 요청 추적, 오류율, KPI 대시보드

### 7) 화면 흐름
1) URL/이미지 입력 → 2) 유효성 검사/로딩 → 3) 쿠팡 메타/이미지 수집 → 4) 두 플랫폼 병렬 탐색(부분 결과 즉시 노출) → 5) 최종 요약(발견/미발견/신뢰도)

### 8) UX/UI
- 직관성: 한 줄 입력 + 큰 CTA, 드롭존 안내
- 결과 카드: 썸네일, 제목, 플랫폼 아이콘, 신뢰도, URL 버튼
- 사용자 친화 인터랙션: 드래그&드롭, 붙여넣기 감지, 자동 포커스, 로딩 스켈레톤, 토스트/툴팁, 복사 버튼
- 반응형: 모바일 1열, 태블릿 2열, 데스크톱 3~4열
- 디자인 시스템: Tailwind 유틸 사용(Windtail), 라이트/다크 모드, 상태 컬러 일관성

### 9) 아키텍처
- 프론트엔드: React + TailwindCSS, Vercel 호스팅
- 백엔드: Serverless API(검색/탐색), 워커(크롤)
- 데이터: 캐시/로그/히스토리 저장(DB 예: Supabase)
- 큐/비동기: 탐색 작업을 잡으로 분리, 재시도/백오프

### 10) 데이터 모델(예시)
- ProductQuery: id, source, sourceUrl, title, brand, images[], createdAt
- PlatformMatch: id, queryId, platform("xhs"|"ae"), url, score, matchedBy, createdAt
- SearchJob: id, queryId, status, attempts, error
- ImageSignature: id, queryId, imageUrl, pHash, aHash, width, height

### 11) 외부 연동/제한
- 샤오홍슈/알리익스프레스: 공개 페이지 기반 탐색, 레이트리밋/차단 대비
- 법/정책: robots/약관 준수, 과도한 요청 방지, 개인정보 최소 수집

### 12) 매칭 알고리즘(요약)
- 전처리: 쿠팡 이미지 리사이즈/그레이스케일 → pHash/aHash, 텍스트 토큰화
- 탐색: 텍스트 검색으로 후보 수집 → 후보 이미지 pHash 비교
- 스코어링: S = 0.7*S_img + 0.3*S_txt, 임계치 이상만 채택(예: 0.82)

### 13) 에지 케이스
- 비공개/로그인 요구, 워터마크/자르기, 번들/옵션, 중복 결과, 타임아웃 시 부분 결과 우선

### 14) 보안/컴플라이언스
- URL 호스트 화이트리스트, SSRF 방지, 요청 타임박스, robots 준수

### 15) 로깅/모니터링
- 요청 ID, 처리 시간, 스코어 분포, 오류율, 알림/대시보드

### 16) 테스트/QA
- 단위(파서/해시/스코어), 통합(후보→최종 URL), 회귀(셀렉터 변경), 샘플 라벨 정확도 측정

### 17) 롤아웃
- 베타 → 제한 공개 → 전체 공개, 기능 토글, 캐시 프리로드

### 18) 수용 기준
- 3초 내 첫 결과 노출, 발견 시 URL 카드 표시, 둘 다 미발견 시 URL 미표시 및 안내, 반응형 레이아웃 안정

### 19) UI 컴포넌트
- SearchBar, Dropzone, ResultCard, EmptyState/ErrorState/LoadingSkeleton
- Tailwind 유틸 예: `container mx-auto p-4`, `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`, `btn btn-primary`, `badge`, `skeleton`

### 20) 기술 스택
- 프론트엔드: React + TailwindCSS(Vercel)
- 백엔드: Serverless API + 워커(탐색/크롤)
- 데이터/로그: Supabase

—
- 링크: 쿠팡 [`https://www.coupang.com/`](https://www.coupang.com/), 샤오홍슈 [`https://www.xiaohongshu.com/`](https://www.xiaohongshu.com/), 알리익스프레스 [`https://ko.aliexpress.com/`](https://ko.aliexpress.com/)

