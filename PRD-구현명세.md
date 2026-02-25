# 우리들의 즐거운 시간 (우즐시) — 구현 명세(PRD-구현명세)

> **슬로건**: “매일 아침, 당신의 입가에 피어나는 작은 미소”  
> 비개발자가 Cursor로 바로 구현/수정할 수 있도록 **화면·컴포넌트·데이터·저장소(localStorage)** 기준으로 구체화한 문서입니다.

---

## 0. 현재 구현 범위(요약)

- **플랫폼**: Next.js 웹 앱(모바일 브라우저 중심)
- **피드**: 유머/건강/지혜 카테고리 탭 + 카드 스크롤
- **뷰 모드**: **카드형**(기본, 스크롤 피드) ↔ **게시판형**(제목 목록 → 클릭 → 상세) 토글
- **본문 가독성**: 줄바꿈/문단 구분 자동 적용 (`FormattedBody` 컴포넌트)
- **좋아요(저장)**: 카드 우측 상단 하트(저장/해제) → 상단 “좋아요 모아보기”에서 모아보기
- **평가(따봉)**: 👍/👎 버튼으로 평가, 버튼 누르면 **다음 카드로 자동 스크롤** (카드형만)
- **공유하기**: Web Share API(가능하면) → 미지원이면 클립보드 복사, 카드 우측 상단에 공유 수 표시
- **콘텐츠 필터링**: 키워드 필터 + 저품질/테스트 콘텐츠 자동 필터링
- **정치/성적 컨텐츠**: 포함하지 않는 방향(콘텐츠 정책은 기획 PRD 참고)

---

## 1. 기술 스택

- **Frontend**: Next.js(App Router), React, TypeScript
- **Style**: Tailwind CSS
- **Icons**: `lucide-react`
- **저장소**: `localStorage` (서버/DB 없음, 단말 기준)

---

## 2. 디자인/접근성 규칙

- **배경**: 눈이 편한 미색 `#F5F0E8`
- **글자 크기**: 본문 최소 24px(`text-2xl`) 이상
- **대비**: 진한 글자색 `#2C2416`, 버튼은 고대비 유지
- **아이콘**: 텍스트만 보이지 않도록 **큼직한 아이콘(대략 28~32px)** 동반

---

## 3. 라우트/화면

### 3.1 라우트

- `/`: 피드 메인 + 좋아요 모아보기 토글

### 3.2 헤더

- 상단 타이틀:
  - 1줄: **우즐시** (크게)
  - 2줄: 우리들의 즐거운 시간
  - 3줄: 슬로건
- 버튼 (좌우 배치):
  - 좌: `좋아요 모아보기` ↔ `전체 피드 보기` 토글
  - 우: `게시판` ↔ `카드` 뷰 모드 토글 (아이콘 + 텍스트)

### 3.3 피드 카드(FeedCard) 와이어프레임

```
+--------------------------------------------------+
| (카드)                                            |
|  [제목(선택)]                    [하트][숫자] [공유][숫자] |
|                                                   |
|  본문 텍스트(24px 이상)                            |
|  (이미지 있으면 1장)                               |
|                                                   |
|  [👍  숫자]   [👎  숫자]                            |
|                                                   |
|  [공유하기 버튼]                                   |
+--------------------------------------------------+
```

---

## 4. 컴포넌트/파일 구조

### 4.1 주요 파일

- `app/layout.tsx`: 메타/전역 바디 스타일
- `app/page.tsx`: 피드/상태/저장소 로직(좋아요/평가/공유수/필터)
- `components/CategoryTabs.tsx`: 카테고리 탭(아이콘 포함)
- `components/FeedCard.tsx`: 카드 UI(우측 상단 아이콘+숫자, 👍/👎, 공유하기)
- `components/FormattedBody.tsx`: 본문 줄바꿈/문단 자동 포맷 컴포넌트
- `components/BoardView.tsx`: 게시판형 뷰 (제목 목록 + 상세 보기)
- `data/feed.ts`: 목업 카드 데이터(시드 카운트 포함)
- `types/content.ts`: `ContentCard`
- `types/reaction.ts`: `RatingType`

---

## 5. 데이터 구조

### 5.1 카드 타입 (외부 원문 + 출처 포함)

```ts
// types/content.ts
export type Category = "humor" | "health" | "wisdom";

export interface ContentCard {
  id: string;
  category: Category;
  title?: string;
  body: string;               // 외부 원문 본문 그대로(필터만 통과한 상태)
  imageUrl?: string | null;
  createdAt?: string;

  // 출처 정보(필수)
  sourceName?: string;        // 예: "다음카페 ○○등산 · 좋은글 게시판"
  sourceUrl?: string;         // 원문 링크 URL

  // 표시용 시드 카운트(모의 집계)
  thumbsUpCount?: number;
  thumbsDownCount?: number;
  likedCount?: number;
  shareCount?: number;
}
```

### 5.2 평가 타입(따봉)

```ts
// types/reaction.ts
export type RatingType = "thumbsUp" | "thumbsDown";
```

---

## 6. 로컬 저장소(localStorage) 설계

- **좋아요(저장) 목록**
  - key: `haha-harabeoji-liked`
  - value: `string[]` (cardId 배열)
- **평가(👍/👎)**
  - key: `haha-harabeoji-reactions`
  - value: `Record<string, "thumbsUp" | "thumbsDown">`
- **공유 횟수(단말 기준 증가분)**
  - key: `haha-harabeoji-shareCounts`
  - value: `Record<string, number>`

### 6.1 표시 숫자 계산 규칙(현재 구현)

- **좋아요 숫자**: `card.likedCount(시드) + (내가 좋아요면 +1)`
- **공유 숫자**: `card.shareCount(시드) + (이 단말에서 공유한 증가분)`
- **👍 숫자**: `card.thumbsUpCount(시드) + (내가 👍이면 +1)`
- **👎 숫자**: `card.thumbsDownCount(시드) + (내가 👎이면 +1)`

> 주의: 서버가 없기 때문에 숫자는 “전 유저의 실제 집계”가 아니라 **시드+내 행동을 더해 보여주는 UI용 값**입니다.

---

## 7. 기능 상세 동작(수용 기준)

### 7.1 좋아요(저장)

- 카드 우측 상단 하트 버튼 탭 → 저장/해제 토글
- 저장된 글은 상단 토글 버튼을 통해 “내가 좋아요 누른 게시글”에서만 모아서 확인
- 수용 기준
  - [ ] 하트 버튼은 작은 크기(약 44px 높이)여도 터치 가능
  - [ ] 저장/해제가 즉시 반영
  - [ ] 새로고침 후에도 유지(localStorage)

### 7.2 평가(👍/👎) + 다음 카드 이동

- 👍/👎 중 하나 탭 → 평가 저장 + 숫자 반영 + 다음 카드로 스크롤
- 수용 기준
  - [ ] 평가 후 다음 카드로 부드럽게 이동
  - [ ] 새로고침 후에도 유지(localStorage)

### 7.3 공유하기 + 공유 수

- 공유하기 버튼 탭 → 공유 증가분 +1 기록 → share sheet(Web Share) 시도
- Web Share 미지원 → 클립보드 복사
- 수용 기준
  - [ ] 공유 버튼 동작 실패 시에도 최소한 클립보드 복사 동작
  - [ ] 공유 증가분이 숫자에 반영되고 새로고침 후 유지

---

## 8. Cursor로 수정할 때 추천 프롬프트(예시)

- “`components/FeedCard.tsx`에서 우측 상단 하트/공유 숫자의 폰트 크기를 1단계 키워줘.”
- “`app/page.tsx`에서 ‘내가 좋아요 누른 게시글’ 화면에서도 카테고리 필터가 되게 바꿔줘.”
- “`data/feed.ts`에 카드 10개 더 추가해줘(정치/성적 컨텐츠 없이).”

---

## 9. 자동 수집(크롤링) 파이프라인 — 상세 구현 명세

### 9.0 왜 브라우저 기반인가?

다음카페·네이버카페 등 주요 커뮤니티는 **서버에서 빈 HTML 껍데기만 내려주고, 실제 게시글 목록/본문은 JavaScript가 실행된 뒤에 그려진다(CSR/SPA)**. 따라서 단순 `fetch + cheerio`(정적 HTML 파싱)로는 내용을 가져올 수 없다.

> **결론**: Headless Browser(Puppeteer)로 **실제 브라우저를 띄워서** 페이지가 완전히 렌더링된 뒤 DOM을 읽는 방식을 사용한다.

---

### 9.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│  npm run collect                                     │
│  (scripts/collect-content.ts)                        │
│                                                      │
│  1. data/sources.ts 에서 소스 목록 로드              │
│  2. 소스별로 Puppeteer 브라우저 실행                 │
│  3. 목록 페이지 접속 → JS 렌더링 대기 → 스크롤      │
│  4. 게시글 링크 추출                                 │
│  5. 각 게시글 상세 페이지 접속 → 제목/본문 추출      │
│  6. 키워드 필터링 (정치/광고/성인/혐오/허위건강)     │
│  7. 통과한 글 → ContentCard 변환                     │
│  8. data/feed-collected.json 으로 저장               │
│                                                      │
│  ※ 실패 시 data/collect-debug/ 에 HTML+스크린샷 저장 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  앱(Next.js)                                         │
│                                                      │
│  data/feed.ts:                                       │
│    feed-collected.json 에 데이터가 있으면 → 그걸 사용│
│    비어있으면 → 기본 예시 데이터(defaultFeedData) 사용│
└─────────────────────────────────────────────────────┘
```

---

### 9.2 기술 스택 (수집 전용)

| 도구 | 역할 | 비고 |
|------|------|------|
| **Puppeteer** | Headless Chrome 제어 | JS 렌더링 페이지 대응 |
| **tsx** | TypeScript 스크립트 직접 실행 | `npx tsx scripts/...` |
| **Node.js fs** | 결과 JSON 파일 저장 | `data/feed-collected.json` |

---

### 9.3 소스 설정 파일: `data/sources.ts`

```ts
export interface SourceConfig {
  id: string;                    // 고유 ID (예: "daum-hwamok-good")
  type: "html-list";             // 수집 타입 (향후 "rss" 등 확장 가능)
  name: string;                  // 출처 이름 (카드에 표시)
  category: "humor" | "health" | "wisdom";
  listUrl: string;               // 게시판 목록 URL (모바일 권장)
  itemSelector: string;          // 목록에서 각 게시글 아이템 CSS 선택자
  linkSelector: string;          // 아이템 내 상세 링크 CSS 선택자
  titleSelector: string;         // 상세 페이지 제목 CSS 선택자
  bodySelector: string;          // 상세 페이지 본문 CSS 선택자
}
```

#### 소스 추가 규칙

1. **로그인 없이 접근 가능한 게시판만** 등록한다.
2. **모바일 URL을 우선** 사용한다 (DOM 구조가 단순하고 로딩이 빠름).
3. CSS 선택자는 **콤마(,)로 복수 지정** 가능 — DOM 구조가 바뀌어도 대응.
4. 카테고리는 게시판 성격에 맞게 `humor` / `health` / `wisdom` 중 하나를 지정.

#### 지원 플랫폼별 URL 패턴

| 플랫폼 | 목록 URL 패턴 | 비고 |
|--------|---------------|------|
| **다음카페(모바일)** | `https://m.cafe.daum.net/{cafeId}/{boardId}` | JS 렌더링, Puppeteer 필수 |
| **네이버카페(모바일)** | `https://m.cafe.naver.com/{cafeName}?boardType=L` | JS 렌더링, Puppeteer 필수 |
| **네이버카페(게시판)** | `https://m.cafe.naver.com/ca-fe/cafes/{numId}/boards/{boardId}` | 숫자 ID 필요 |

#### 등록할 소스 목록 (초기)

| # | 플랫폼 | 카페명 | 게시판 | 카테고리 | 비고 |
|---|--------|--------|--------|----------|------|
| 1 | 다음카페 | 화목한 친구들 | 감동♡좋은글 | wisdom | 기존 등록 |
| 2 | 다음카페 | 화목한 친구들 | 유머 게시판 | humor | 같은 카페 다른 게시판 |
| 3 | 다음카페 | 화목한 친구들 | 건강 게시판 | health | 같은 카페 다른 게시판 |
| 4 | 네이버카페 | 전국등산동호회 | 유머/재미 | humor | 50~70대 활동 활발 |
| 5 | 네이버카페 | 전국등산동호회 | 좋은글/지혜 | wisdom | |
| 6 | 네이버카페 | 전국등산동호회 | 건강정보 | health | |

> **참고**: 네이버카페는 게시판 숫자 ID를 브라우저 개발자도구에서 확인해야 한다. 초기에는 다음카페 위주로 시작하고, 네이버는 ID 확인 후 추가한다.

---

### 9.4 수집 흐름 (Step-by-Step)

```
[시작] npm run collect
  │
  ├─ 1. sources 배열 순회
  │     │
  │     ├─ 2. Puppeteer 브라우저 실행
  │     │     - 시스템 Chrome 우선 → 없으면 번들 Chromium
  │     │     - Headless 모드, 모바일 뷰포트(375×812)
  │     │
  │     ├─ 3. listUrl 접속 → networkidle2 대기 (최대 30초)
  │     │
  │     ├─ 4. itemSelector 대기 (최대 10초)
  │     │     - 실패 시 → HTML + 스크린샷 저장 → 다음 소스로
  │     │
  │     ├─ 5. 자동 스크롤 (COLLECT_SCROLL_STEPS회, 기본 4회)
  │     │     - 무한스크롤/지연로딩 대응
  │     │
  │     ├─ 6. 목록에서 {제목, 링크} 배열 추출
  │     │     - linkSelector로 a태그 href 수집
  │     │     - 중복 링크 제거
  │     │
  │     ├─ 7. 각 상세 페이지 순회 (최대 COLLECT_LIMIT건, 기본 30)
  │     │     ├─ 제목 키워드 필터 → 걸리면 skip
  │     │     ├─ 상세 페이지 접속 → bodySelector 대기
  │     │     ├─ 제목 + 본문 텍스트 추출
  │     │     ├─ 본문 길이 < 20자 → skip
  │     │     ├─ 본문 키워드 필터 → 걸리면 skip
  │     │     └─ ContentCard 생성 → results 배열에 push
  │     │
  │     └─ 8. 브라우저 종료
  │
  └─ 9. 전체 results → data/feed-collected.json 저장
```

---

### 9.5 키워드 필터링 정책

수집 단계에서 **제목 또는 본문**에 아래 키워드가 포함되면 해당 글 전체를 제외한다.

| 분류 | 키워드 예시 |
|------|-------------|
| **정치** | 정치, 대통령, 여당, 야당, 투표, 선거 |
| **성인** | 19금, 성인, 야한, 섹스 |
| **광고/홍보** | 광고, 홍보, 무료상담, 상담문의, 구매, 판매, 할인, 대리점 |
| **연락 유도** | 카톡, 오픈채팅, 텔레그램, 문의는, 연락주세요 |
| **종교/미신** | 종교, 하나님, 예수님, 부처님, 사주, 타로 |
| **투자/사기** | 투자, 코인, 주식, 대박, 수익 |
| **혐오** | 욕설, 비하, 혐오 |
| **허위 건강** | 항암, 기적, 완치, 만병통치 |

> 키워드는 `scripts/collect-content.ts` 상단 `FILTER_KEYWORDS` 배열에서 관리한다. 오탐이 많으면 키워드를 좁히고, 누락이 많으면 넓힌다.

#### 저품질/테스트 콘텐츠 필터

키워드 필터 외에 **품질 기반 필터**도 적용한다. `LOW_QUALITY_PATTERNS` 정규식 배열과 아래 규칙으로 관리:

| 조건 | 설명 |
|------|------|
| `/테스트/i`, `/test/i` | 테스트용 포스팅 제거 |
| `/포스팅$/` | "~포스팅"으로 끝나는 제목 제거 |
| `/첨부파일/`, `/첨부된 파일/` | 첨부파일 안내만 있는 글 제거 |
| 본문 80자 미만 | 너무 짧아 의미 없는 글 제거 |
| 한국어 비율 30% 미만 | 영어/특수문자 위주 스팸 제거 |

---

### 9.6 출력 형식: `data/feed-collected.json`

```json
[
  {
    "id": "collected-abc123",
    "category": "humor",
    "title": "게시글 제목",
    "body": "원문 본문 그대로...",
    "sourceName": "다음카페 화목한 친구들 · 감동♡좋은글",
    "sourceUrl": "https://m.cafe.daum.net/gwangnaru77/EYIU/12345",
    "createdAt": "2026-02-05T12:00:00.000Z",
    "thumbsUpCount": 32,
    "thumbsDownCount": 1,
    "likedCount": 8,
    "shareCount": 3,
    "sourceId": "daum-hwamok-good"
  }
]
```

- `id`: 소스ID + 원문URL 기반 해시 → 같은 글을 두 번 수집해도 같은 ID
- `thumbsUpCount` 등: 초기 시드값(랜덤), 서버 없으므로 표시용
- `sourceId`: 어떤 소스에서 왔는지 추적용 (앱에서는 사용 안 함)

---

### 9.7 앱 연동: `data/feed.ts`

```ts
import collected from "./feed-collected.json";

const defaultFeedData: ContentCard[] = [ /* 기본 예시 데이터 */ ];

// 수집본이 있으면 수집본, 없으면 기본 데이터
export const feedData: ContentCard[] =
  (Array.isArray(collected) && collected.length > 0
    ? collected
    : defaultFeedData) as ContentCard[];
```

- `npm run collect` 실행 후 **개발 서버 재시작**(`npm run dev`)하면 수집본이 피드에 반영됨.

---

### 9.8 에러 처리 & 디버깅

| 상황 | 동작 |
|------|------|
| 브라우저 실행 실패 | 시스템 Chrome → 번들 Chromium 순서로 시도. 둘 다 실패 시 에러 메시지 출력 |
| 목록 셀렉터 미발견 | `data/collect-debug/{sourceId}-list-{timestamp}.html` + `.png` 저장 |
| 상세 페이지 로딩 실패 | `data/collect-debug/{sourceId}-detail-{timestamp}.html` + `.png` 저장 |
| 0건 수집 | 디버그 파일 확인 후 셀렉터 수정 |

---

### 9.9 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `COLLECT_LIMIT` | `30` | 소스당 최대 수집 건수 |
| `COLLECT_SCROLL_STEPS` | `4` | 목록 페이지 자동 스크롤 횟수 |
| `CHROME_PATH` | (자동 탐색) | 크롬 실행 파일 경로 직접 지정 |

```bash
# 예시: 소스당 50건, 스크롤 6회
COLLECT_LIMIT=50 COLLECT_SCROLL_STEPS=6 npm run collect
```

---

### 9.10 파일 구조

```
data/
  sources.ts              ← 수집 소스 설정 (URL, 셀렉터)
  feed.ts                 ← 앱이 읽는 피드 데이터 (수집본 우선)
  feed-collected.json     ← 수집 결과 (npm run collect 산출물)
  collect-debug/          ← 수집 실패 시 디버그 파일 (HTML, PNG)

scripts/
  collect-content.ts      ← 수집 메인 스크립트
```

---

### 9.11 향후 개선 방향

| 단계 | 내용 |
|------|------|
| **Phase 1 (현재)** | RSS 기반 수동 실행 (`npm run collect`) |
| **Phase 2** | cron/스케줄러로 주기적 자동 수집 (예: 매일 오전 6시) |
| **Phase 3** | 중복 검사 강화 (기존 feed-collected.json과 병합, 새 글만 추가) |
| **Phase 4** | LLM 기반 필터링 (키워드 한계 보완, 맥락 이해) |
| **Phase 5** | 서버/DB 도입 시 수집 → DB 저장 → API 제공 파이프라인 |

---

## 10. 뷰 모드 (카드형 / 게시판형)

### 10.1 개요

사용자가 **카드형**(기본)과 **게시판형** 두 가지 레이아웃을 토글할 수 있다.

| 모드 | 설명 | 아이콘 |
|------|------|--------|
| **카드형** (기본) | 기존 스크롤 피드. 제목+본문이 카드로 펼쳐져 보임 | `Rows3` |
| **게시판형** | 제목 목록만 표시. 클릭하면 상세 페이지로 전환 | `LayoutList` |

### 10.2 게시판형 상세

- **목록 화면**: 카테고리 뱃지 + 제목 + 따봉 수 표시
- **상세 화면**: "목록으로" 뒤로가기 버튼 + 카테고리 뱃지 + 제목 + 날짜 + 본문 + 출처 + 평가/공유 버튼
- 좋아요/평가/공유 기능은 카드형과 동일하게 동작

### 10.3 컴포넌트

- `components/BoardView.tsx`: 게시판형 전체 (목록 + 상세 상태 관리)
- `app/page.tsx`: `FeedLayout` 타입 (`"card" | "board"`) 상태 관리, 토글 버튼

---

## 11. 본문 가독성 (FormattedBody)

### 11.1 개요

수집된 콘텐츠의 줄바꿈(`\n`)과 문단 구분(`\n\n`)을 HTML 구조로 변환하여 가독성을 높인다.

### 11.2 동작 규칙

| 입력 패턴 | 출력 |
|-----------|------|
| `\n\n` (빈 줄) | 문단 구분 (`<div>` + `space-y-4`) |
| `\n` (단일 줄바꿈) | 줄 구분 (`<p>` + `space-y-2`) |
| 줄바꿈 없음 | 단일 `<p>` 태그 |

### 11.3 컴포넌트

- `components/FormattedBody.tsx`: `text` prop을 받아 자동 포맷
- `FeedCard.tsx`와 `BoardView.tsx` 모두에서 사용

