export type Category = "humor" | "health" | "wisdom" | "history";

export interface ContentCard {
  id: string;
  category: Category;
  title?: string;
  /** 본문. 이미지는 ![img](URL) 마커로 포함 */
  body: string;
  /** @deprecated 하위호환용. 새 글은 body 안에 이미지 마커 사용 */
  imageUrl?: string | null;
  createdAt?: string;
  /** 자동 생성된 태그 목록 */
  tags?: string[];
  /** 출처 이름(예: 다음카페 ○○등산 · 좋은글 게시판) */
  sourceName?: string;
  /** 원문 링크 URL */
  sourceUrl?: string;
  /** 표시용 시드 값 (따봉 위) */
  thumbsUpCount?: number;
  /** 표시용 시드 값 (따봉 아래) */
  thumbsDownCount?: number;
  /** 표시용 시드 값 (좋아요/저장) */
  likedCount?: number;
  /** 표시용 시드 값 (공유 횟수) */
  shareCount?: number;
}
