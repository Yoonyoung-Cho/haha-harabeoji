/** 게시글 평가 (따봉 위/아래) */
export type RatingType = "thumbsUp" | "thumbsDown";

export interface UserRating {
  cardId: string;
  rating: RatingType;
}
