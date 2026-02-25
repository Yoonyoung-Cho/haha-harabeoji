import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import { sources, type SourceConfig } from "../data/sources";
import type { ContentCard, Category } from "../types/content";

// ─── 설정 ───
const LIMIT = Number.parseInt(process.env.COLLECT_LIMIT ?? "20", 10);

// ─── 필터링 키워드 ───
const FILTER_KEYWORDS = [
  "정치", "대통령", "여당", "야당", "투표", "선거", "국회",
  "19금", "성인", "야한", "섹스", "성폭행", "성추행",
  "광고", "홍보", "무료상담", "상담문의", "판매", "할인", "대리점", "보험료",
  "카톡", "오픈채팅", "텔레그램", "문의는", "연락주세요",
  "하나님", "예수님", "부처님", "사주", "타로",
  "투자", "코인", "주식", "대박", "수익률",
  "욕설", "비하", "혐오",
  "항암", "기적의", "완치", "만병통치",
];

// ─── 저품질/테스트 콘텐츠 필터 ───
const LOW_QUALITY_PATTERNS = [
  /테스트/i,
  /test/i,
  /포스팅$/,
  /첨부파일/,
  /첨부된 파일/,
  /click.*download/i,
  /\bexercise\b/i,
  /\bplank\b/i,
  /\bbridge\b/i,
  /stamp/i,
  /galaxy/i,
  /포켓몬/,
  /작성 예정/,
  /준비 중입니다/,
  /알아보겠습니다\.?$/i, // 이걸로 끝나는 글
  /정리해봤습니다\.?$/i,
];

function isFiltered(text: string): boolean {
  const lower = text.toLowerCase();
  return FILTER_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function isLowQuality(title: string, body: string): boolean {
  const combined = `${title} ${body}`;
  if (LOW_QUALITY_PATTERNS.some((p) => p.test(combined))) return true;
  if (body.length < 150) return true; // 최소 길이 상향
  const koreanChars = body.match(/[가-힣]/g)?.length ?? 0;
  if (koreanChars < body.length * 0.3) return true;
  return false;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<img[^>]+(?:src|data-src)\s*=\s*["']([^"']+)["'][^>]*>/gi, (_m, src: string) => {
      const url = src.startsWith("//") ? `https:${src}` : src;
      if (!url.startsWith("http")) return "";
      // 플레이스홀더/트래커 이미지 제외
      if (
        url.includes("no-image") ||
        url.includes("tistory_admin/static") ||
        url.includes("placeholder") ||
        url.includes("1x1") ||
        url.includes("pixel") ||
        url.includes("spacer")
      ) return "";
      return `\n\n![img](${url})\n\n`;
    })
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&darr;/g, "↓")
    .replace(/&uarr;/g, "↑")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stableId(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) hash = (hash * 33) ^ input.charCodeAt(i);
  return `collected-${(hash >>> 0).toString(36)}`;
}

// ─── 자동 카테고리 분류 (가중치 기반) ───
// [키워드, 가중치] — 가중치가 높을수록 해당 카테고리 확신도 높음
type WeightedKeyword = [string, number];
const CATEGORY_RULES: Record<Category, WeightedKeyword[]> = {
  history: [
    // 시대/왕조 (강한 신호)
    ["조선시대", 5], ["고려시대", 5], ["삼국시대", 5], ["임진왜란", 5],
    ["청나라", 4], ["금나라", 4], ["몽골제국", 4], ["로마제국", 4],
    ["메이지유신", 4], ["문화혁명", 4],
    // 역사적 인물 (강한 신호)
    ["이순신", 5], ["안중근", 5], ["세종대왕", 5], ["마오쩌둥", 4],
    ["푸이", 4], ["최배달", 3], ["콤모두스", 4],
    // 역사 일반 (중간 신호)
    ["왕조", 3], ["황제", 3], ["왕국", 3], ["제국", 3],
    ["전쟁사", 3], ["해전", 3], ["공습", 3],
    ["멸망", 3], ["독립운동", 4], ["의병", 3],
    ["식민지", 3], ["개항기", 3], ["발전사", 3], ["기원", 3],
    // 약한 신호
    ["역사", 2], ["조선", 2], ["고려", 2],
  ],
  health: [
    ["건강", 3], ["운동", 2], ["스트레칭", 4], ["혈압", 4], ["당뇨", 4],
    ["혈액순환", 4], ["면역력", 4], ["수면", 3], ["근육", 3],
    ["다이어트", 3], ["영양소", 3], ["비타민", 3], ["칼로리", 3],
    ["병원", 2], ["장수", 3], ["식습관", 3], ["체중", 3],
  ],
  humor: [
    // 웃음/재미
    ["유머", 5], ["웃긴", 4], ["재미있", 3], ["개그", 5], ["농담", 4],
    ["코미디", 4], ["웃음", 3], ["빵터", 5], ["웃겨", 4],
    ["ㅋㅋ", 3], ["ㅎㅎ", 2],
    // 흥미로운 상식/잡학 (사용자 요청: 유령정체 등은 유머/재미로 분류)
    ["유령정체", 5], ["막히는 이유", 4], ["알고보니", 3], ["반전", 3],
    ["비밀", 3], ["이유는", 3], ["몰랐던", 3], ["사실", 2],
    ["고양이", 3], ["동물", 2], ["체스", 3], ["운하", 3],
    ["신기한", 3], ["놀라운", 3],
  ],
  wisdom: [
    ["인생", 2], ["성공", 2], ["습관", 2], ["명언", 4], ["격언", 4],
    ["자기계발", 4], ["동기부여", 4], ["목표", 2],
    ["행복", 3], ["감사", 3], ["긍정", 3], ["마음가짐", 4],
    ["부자가 되", 3], ["말버릇", 3], ["복수하는 방법", 3],
    ["책 읽", 3], ["독서법", 4], ["지혜", 3],
  ],
};

function autoClassify(title: string, body: string, sourceCategory: Category): Category {
  const text = `${title} ${body}`;
  const titleText = title;
  const scores: Record<Category, number> = { history: 0, health: 0, humor: 0, wisdom: 0 };

  for (const [cat, rules] of Object.entries(CATEGORY_RULES)) {
    for (const [kw, weight] of rules) {
      const kwLower = kw.toLowerCase();
      // 제목에 있으면 가중치 2배
      if (titleText.toLowerCase().includes(kwLower)) {
        scores[cat as Category] += weight * 2;
      } else if (text.toLowerCase().includes(kwLower)) {
        scores[cat as Category] += weight;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore < 3) return sourceCategory;

  const sorted = (Object.entries(scores) as [Category, number][]).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

// ─── 자동 태그 생성 ───
const TAG_KEYWORDS: Record<string, string[]> = {
  "한국사": ["조선", "고려", "임진왜란", "이순신", "안중근", "세종", "독립운동"],
  "세계사": ["로마", "몽골", "청나라", "금나라", "메이지유신", "진주만", "마오쩌둥"],
  "전쟁": ["전쟁", "전투", "공습", "해전", "항복"],
  "인물": ["이순신", "안중근", "최배달", "마오쩌둥", "푸이", "콤모두스", "오노다"],
  "음식": ["소주", "돈가스", "음식"],
  "동물": ["고양이", "강아지"],
  "건강": ["건강", "운동", "근육", "장수", "병원"],
  "자기계발": ["성공", "습관", "자기계발", "동기부여"],
  "독서": ["책 읽", "독서"],
  "재테크": ["부자", "돈이 따라"],
  "흥미": ["이유", "원리", "유령정체", "고속도로", "비밀", "신기한"],
  "과학": ["인간", "지배", "전염병"],
};

function generateTags(title: string, body: string): string[] {
  const text = `${title} ${body}`.toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 4);
}

// ─── 수집 결과 타입 ───
interface CollectedCard extends ContentCard {
  sourceId: string;
}

// ─── RSS 수집 (cheerio, 브라우저 불필요) ───
async function collectFromRss(source: SourceConfig): Promise<CollectedCard[]> {
  const results: CollectedCard[] = [];

  console.log("  → RSS 피드 가져오는 중...");
  const res = await fetch(source.listUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; UzlsiBot/1.0)" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn(`  ⚠ HTTP ${res.status}`);
    return [];
  }

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = $("item, entry");

  console.log(`  → ${items.length}개 항목 발견`);

  items.each((i, el) => {
    if (results.length >= LIMIT) return false; // break

    const title = clean($(el).find("title").text());
    const link = $(el).find("link").text() || $(el).find("link").attr("href") || "";
    const descHtml = $(el).find("description, content, content\\:encoded").text();
    const body = stripHtml(descHtml).replace(/[ \t]+/g, " ").replace(/\n /g, "\n").trim();

    if (!title || !body) return;
    if (isFiltered(title)) {
      console.log(`  ✕ 제목 필터: ${title.slice(0, 40)}`);
      return;
    }
    if (isFiltered(body)) {
      console.log(`  ✕ 본문 필터: ${title.slice(0, 40)}`);
      return;
    }
    if (isLowQuality(title, body)) {
      console.log(`  ✕ 저품질: ${title.slice(0, 40)}`);
      return;
    }

    const category = autoClassify(title, body, source.category);
    const tags = generateTags(title, body);

    results.push({
      id: stableId(`${source.id}:${link}`),
      category,
      title,
      body,
      tags: tags.length > 0 ? tags : undefined,
      sourceName: source.name,
      sourceUrl: link,
      createdAt: $(el).find("pubDate, published, updated").text() || new Date().toISOString(),
      thumbsUpCount: Math.floor(Math.random() * 40) + 5,
      thumbsDownCount: Math.floor(Math.random() * 3),
      likedCount: Math.floor(Math.random() * 15),
      shareCount: Math.floor(Math.random() * 8),
      sourceId: source.id,
    });

    console.log(`  ✓ [${results.length}/${LIMIT}] ${title.slice(0, 50)}`);
  });

  return results;
}

// ─── 원본 페이지에서 이미지 추출 ───
const PAGE_CONTENT_SELECTORS =
  ".entry-content, .tt_article_useless_p_margin, .contents_style, .article_view, .area_view";

const PLACEHOLDER_IMG = [
  "no-image", "tistory_admin/static", "placeholder",
  "1x1", "pixel", "spacer", "loading-image",
];

function resolveImgUrl(
  $el: ReturnType<ReturnType<typeof cheerio.load>>,
): string | null {
  const raw =
    $el.attr("data-origin-src") ||
    $el.attr("data-lazy-src") ||
    $el.attr("data-src") ||
    $el.attr("src") ||
    "";
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  if (!url.startsWith("http")) return null;
  const lower = url.toLowerCase();
  if (PLACEHOLDER_IMG.some((p) => lower.includes(p))) return null;
  return url;
}

async function fetchPageBody(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);
    const content = $(PAGE_CONTENT_SELECTORS).first();
    if (!content.length) return null;

    content
      .find(
        "script, style, noscript, iframe, .revenue_unit_wrap, " +
        ".container_postbtn, .another_category, .footer_tag, ins, .ads_wrap",
      )
      .remove();

    const parts: string[] = [];

    function walk(node: any) {
      const children: any[] = node.children || [];
      for (const child of children) {
        if (child.type === "text") {
          const text: string = child.data || "";
          if (text.trim()) parts.push(text);
          continue;
        }
        if (child.type !== "tag") continue;

        const tag: string = child.tagName?.toLowerCase() || "";
        if (!tag || ["script", "style", "noscript"].includes(tag)) continue;

        if (tag === "img") {
          const imgUrl = resolveImgUrl($(child));
          if (imgUrl) parts.push(`\n\n![img](${imgUrl})\n\n`);
          continue;
        }
        if (tag === "br") {
          parts.push("\n");
          continue;
        }

        const isBlock = [
          "p", "div", "h1", "h2", "h3", "h4", "h5", "h6",
          "li", "blockquote", "figure", "section", "table", "tr",
        ].includes(tag);

        if (isBlock) parts.push("\n");
        walk(child);
        if (isBlock) parts.push("\n");
      }
    }

    walk(content[0]);

    const body = parts
      .join("")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t]+/g, " ")
      .replace(/\n /g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return body.includes("![img]") && body.length >= 100 ? body : null;
  } catch {
    return null;
  }
}

async function enrichWithPageImages(cards: CollectedCard[]): Promise<void> {
  console.log(
    `\n🖼 이미지 보강: ${cards.length}개 게시글의 원본 페이지에서 이미지 추출 중...`,
  );

  const BATCH = 5;
  let enriched = 0;

  for (let i = 0; i < cards.length; i += BATCH) {
    const batch = cards.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (card) => {
        if (!card.sourceUrl) return;
        const pageBody = await fetchPageBody(card.sourceUrl);
        if (pageBody) {
          card.body = pageBody;
          enriched++;
          const imgCount = (pageBody.match(/!\[img\]/g) || []).length;
          console.log(
            `  🖼 [${enriched}] ${card.title?.slice(0, 40)} → 이미지 ${imgCount}개`,
          );
        }
      }),
    );
  }

  console.log(`  → ${enriched}건 이미지 보강 완료`);
}

// ─── 소스 1개 수집 ───
async function collectFromSource(source: SourceConfig): Promise<CollectedCard[]> {
  console.log(`\n━━━ [${source.id}] ${source.name} ━━━`);
  console.log(`  URL: ${source.listUrl}`);

  try {
    if (source.type === "rss") {
      return await collectFromRss(source);
    }

    // html-list 타입은 Puppeteer 필요 (향후 구현)
    console.log("  ⚠ html-list 타입은 현재 비활성화 (카페 회원 전용 제한)");
    return [];
  } catch (err) {
    console.error(`  ✕ 오류:`, (err as Error).message?.slice(0, 80));
    return [];
  }
}

// ─── 메인 ───
async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  우즐시 콘텐츠 자동 수집기           ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`소스 ${sources.length}개 | 소스당 최대 ${LIMIT}건\n`);

  if (sources.length === 0) {
    console.log("data/sources.ts에 소스가 없습니다.");
    return;
  }

  const all: CollectedCard[] = [];
  
  const startTime = Date.now();
  console.log("병렬 수집 시작...");

  // 병렬 실행
  const results = await Promise.all(
    sources.map((source) => collectFromSource(source))
  );

  for (const cards of results) {
    all.push(...cards);
  }

  const rssDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nRSS 수집 소요 시간: ${rssDuration}초`);

  // 원본 페이지에서 이미지 추출
  const imgStart = Date.now();
  await enrichWithPageImages(all);
  const imgDuration = ((Date.now() - imgStart) / 1000).toFixed(1);
  console.log(`이미지 보강 소요 시간: ${imgDuration}초`);

  const imgCount = all.filter((c) => c.body.includes("![img]")).length;
  console.log(`총 ${all.length}건 중 이미지 포함: ${imgCount}건`);

  // 결과 저장
  const outPath = path.join(process.cwd(), "data", "feed-collected.json");
  await fs.writeFile(outPath, JSON.stringify(all, null, 2), "utf8");

  console.log("\n╔══════════════════════════════════════╗");
  console.log(`║  수집 완료: 총 ${String(all.length).padStart(3)}건                  ║`);
  console.log("╚══════════════════════════════════════╝");
  console.log(`→ ${outPath}`);

  const stats = { humor: 0, health: 0, wisdom: 0, history: 0 };
  for (const c of all) stats[c.category as keyof typeof stats]++;
  console.log(`  유머: ${stats.humor} | 역사: ${stats.history} | 건강: ${stats.health} | 지혜: ${stats.wisdom}`);

  if (all.length > 0) {
    console.log("\nnpm run dev 로 서버 재시작하면 수집된 글이 피드에 반영됩니다.");
  } else {
    console.log("\n0건 수집됨.");
  }
}

main().catch((err) => {
  console.error("[collect] fatal:", err);
  process.exit(1);
});
