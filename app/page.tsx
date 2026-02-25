"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, LayoutList, Rows3, Sparkles } from "lucide-react";
import { feedData } from "@/data/feed";
import type { CategoryFilter } from "@/components/CategoryTabs";
import type { RatingType } from "@/types/reaction";
import { CategoryTabs } from "@/components/CategoryTabs";
import { FeedCard } from "@/components/FeedCard";
import { BoardView } from "@/components/BoardView";

type ViewMode = "feed" | "liked";
type FeedLayout = "card" | "board";

const STORAGE_LIKED = "haha-harabeoji-liked";
const STORAGE_RATINGS = "haha-harabeoji-reactions";
const STORAGE_SHARE_COUNTS = "haha-harabeoji-shareCounts";

function loadLikedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_LIKED);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveLikedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_LIKED, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function loadRatings(): Record<string, RatingType> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_RATINGS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [
        k,
        v === "laugh" || v === "nostalgia" ? "thumbsUp" : (v as RatingType),
      ])
    ) as Record<string, RatingType>;
  } catch {
    return {};
  }
}

function saveRatings(ratings: Record<string, RatingType>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_RATINGS, JSON.stringify(ratings));
  } catch {
    // ignore
  }
}

function loadShareCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_SHARE_COUNTS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function saveShareCounts(counts: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_SHARE_COUNTS, JSON.stringify(counts));
  } catch {
    // ignore
  }
}

export default function FeedPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [feedLayout, setFeedLayout] = useState<FeedLayout>("card");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingType>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setLikedIds(loadLikedIds());
    setRatings(loadRatings());
    setShareCounts(loadShareCounts());
  }, []);

  const likedCards = useMemo(
    () => feedData.filter((c) => likedIds.includes(c.id)),
    [likedIds]
  );

  const filteredCards = useMemo(() => {
    if (category === "all") return feedData;
    return feedData.filter((c) => c.category === category);
  }, [category]);

  const displayCards = viewMode === "liked" ? likedCards : filteredCards;

  const toggleLike = useCallback((cardId: string) => {
    setLikedIds((prev) => {
      const next = prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId];
      saveLikedIds(next);
      return next;
    });
  }, []);

  const setRating = useCallback((cardId: string, rating: RatingType) => {
    setRatings((prev) => {
      const current = prev[cardId];
      const next = { ...prev };

      if (current === rating) {
        // 같은 버튼을 다시 누르면 평가 취소
        delete next[cardId];
      } else {
        next[cardId] = rating;
      }

      saveRatings(next);
      return next;
    });
  }, []);

  const incrementShare = useCallback((cardId: string) => {
    setShareCounts((prev) => {
      const next = { ...prev, [cardId]: (prev[cardId] ?? 0) + 1 };
      saveShareCounts(next);
      return next;
    });
  }, []);

  const scrollToNextCard = useCallback(
    (currentIndex: number) => {
      const nextId = displayCards[currentIndex + 1]?.id;
      if (nextId && typeof document !== "undefined") {
        document.getElementById(`card-${nextId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    },
    [displayCards]
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <header className="border-b border-gray-200 bg-white px-4 py-5">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
          <h1 className="text-center text-5xl font-extrabold tracking-wide text-[#111827]">
            우즐시
          </h1>
          <p className="text-center text-2xl font-semibold text-[#374151]">
            우리들의 즐거운 시간
          </p>
          <p className="flex items-center gap-2 text-center text-2xl leading-relaxed text-[#374151]">
            <Sparkles className="size-7 shrink-0" aria-hidden />
            <span>매일 아침, 당신의 입가에 피어나는 작은 미소</span>
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "liked" ? "feed" : "liked")}
            className="flex flex-1 min-h-[56px] items-center justify-center gap-3 rounded-xl bg-gray-900 px-6 py-3 text-2xl font-medium text-white transition-colors hover:bg-gray-800"
            aria-label={viewMode === "liked" ? "전체 피드 보기" : "내가 좋아요 누른 게시글"}
          >
            <Heart className="size-8 shrink-0" aria-hidden />
            {viewMode === "liked" ? "전체 피드 보기" : "좋아요 모아보기"}
            {viewMode === "feed" && likedIds.length > 0 && (
              <span className="rounded-full bg-white/25 px-3 py-0.5 text-xl">
                {likedIds.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFeedLayout(feedLayout === "card" ? "board" : "card")}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 border-gray-900 px-5 py-3 text-2xl font-medium text-gray-900 transition-colors hover:bg-gray-100"
            aria-label={feedLayout === "card" ? "게시판형으로 보기" : "카드형으로 보기"}
          >
            {feedLayout === "card" ? (
              <>
                <LayoutList className="size-7" aria-hidden />
                게시판
              </>
            ) : (
              <>
                <Rows3 className="size-7" aria-hidden />
                카드
              </>
            )}
          </button>
        </div>
      </header>

      {viewMode === "feed" && (
        <CategoryTabs value={category} onChange={setCategory} />
      )}

      {feedLayout === "board" ? (
        <BoardView
          cards={displayCards}
          likedIds={likedIds}
          ratings={ratings}
          shareCounts={shareCounts}
          onLikeToggle={toggleLike}
          onRating={setRating}
          onShare={incrementShare}
        />
      ) : (
        <section
          className="mx-auto max-w-2xl space-y-6 px-4"
          aria-label={viewMode === "liked" ? "내가 좋아요 누른 게시글" : "유머 카드 목록"}
        >
          {viewMode === "liked" && likedCards.length === 0 ? (
            <p className="py-12 text-center text-2xl text-[#374151]">
              아직 좋아요 누른 글이 없어요. 마음에 드는 글에서 좋아요를 눌러 보세요.
            </p>
          ) : viewMode === "feed" && filteredCards.length === 0 ? (
            <p className="py-12 text-center text-2xl text-[#374151]">
              이 카테고리에 아직 글이 없어요. 전체를 눌러 보세요.
            </p>
          ) : (
            displayCards.map((card, index) => {
              const seedUp = card.thumbsUpCount ?? 0;
              const userRating = ratings[card.id] ?? null;
              const displayThumbsUp = seedUp + (userRating === "thumbsUp" ? 1 : 0);
              const displayLikeCount = (card.likedCount ?? 0) + (likedIds.includes(card.id) ? 1 : 0);
              const displayShareCount = (card.shareCount ?? 0) + (shareCounts[card.id] ?? 0);

              return (
                <FeedCard
                  key={card.id}
                  card={card}
                  liked={likedIds.includes(card.id)}
                  onLikeToggle={() => toggleLike(card.id)}
                  displayLikeCount={displayLikeCount}
                  userRating={userRating}
                  onRating={(r) => setRating(card.id, r)}
                  onAfterRating={() => scrollToNextCard(index)}
                  displayThumbsUp={displayThumbsUp}
                  displayShareCount={displayShareCount}
                  onShare={() => incrementShare(card.id)}
                />
              );
            })
          )}
        </section>
      )}
    </main>
  );
}
