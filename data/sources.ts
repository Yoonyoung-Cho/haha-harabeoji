export type SourceType = "html-list" | "rss";

export interface SourceConfig {
  id: string;
  type: SourceType;
  name: string;
  category: "humor" | "health" | "wisdom" | "history";
  /** RSS: 피드 URL / html-list: 목록 페이지 URL */
  listUrl: string;
  /** html-list 전용 (RSS는 사용 안 함) */
  itemSelector?: string;
  linkSelector?: string;
  titleSelector?: string;
  bodySelector?: string;
}

export const sources: SourceConfig[] = [
  // ─── 유머/재미 ───
  {
    id: "tistory-dailyhumor",
    type: "rss",
    name: "하루치 유머 블로그",
    category: "humor",
    listUrl: "https://dailyhumor.tistory.com/rss",
  },

  // ─── 역사 ───
  {
    id: "tistory-healthinfo",
    type: "rss",
    name: "역사이야기 블로그",
    category: "history",
    listUrl: "https://healthinfo.tistory.com/rss",
  },
  {
    id: "tistory-healthtip",
    type: "rss",
    name: "건강팁 블로그",
    category: "health",
    listUrl: "https://healthtip.tistory.com/rss",
  },
  {
    id: "tistory-dailyhealth",
    type: "rss",
    name: "매일건강 블로그",
    category: "health",
    listUrl: "https://dailyhealth.tistory.com/rss",
  },

  // ─── 지혜/좋은글 ───
  {
    id: "tistory-lifewisdom",
    type: "rss",
    name: "인생지혜 블로그",
    category: "wisdom",
    listUrl: "https://lifewisdom.tistory.com/rss",
  },

  // ─── 다음카페 (회원 전용 → 향후 로그인 지원 시 활성화) ───
  // {
  //   id: "daum-hwamok-good",
  //   type: "html-list",
  //   name: "다음카페 화목한 친구들 · 감동♡좋은글",
  //   category: "wisdom",
  //   listUrl: "https://m.cafe.daum.net/gwangnaru77/EYIU",
  //   itemSelector: "#slideArticleList > ul > li",
  //   linkSelector: "a.link_cafe.make-list-uri, a.link_cafe",
  //   titleSelector: "h3.tit_subject, h3, .tit_view, h1",
  //   bodySelector: "#user_contents, #article",
  // },
];
