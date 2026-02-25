"use client";

import { useState } from "react";
import { ChevronLeft, ExternalLink, Heart, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ContentCard } from "@/types/content";
import type { RatingType } from "@/types/reaction";
import { FormattedBody } from "./FormattedBody";

const CATEGORY_LABEL: Record<string, string> = {
  humor: "유머",
  health: "건강",
  wisdom: "지혜",
  history: "역사",
};

const CATEGORY_COLOR: Record<string, string> = {
  humor: "bg-gray-100 text-gray-900",
  health: "bg-emerald-50 text-emerald-800",
  wisdom: "bg-sky-50 text-sky-800",
  history: "bg-indigo-50 text-indigo-800",
};

interface BoardViewProps {
  cards: ContentCard[];
  likedIds: string[];
  ratings: Record<string, RatingType>;
  shareCounts: Record<string, number>;
  onLikeToggle: (id: string) => void;
  onRating: (id: string, r: RatingType) => void;
  onShare: (id: string) => void;
}

export function BoardView({
  cards,
  likedIds,
  ratings,
  shareCounts,
  onLikeToggle,
  onRating,
  onShare,
}: BoardViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cards.find((c) => c.id === selectedId);

  if (selected) {
    const userRating = ratings[selected.id] ?? null;
    const displayThumbsUp = (selected.thumbsUpCount ?? 0) + (userRating === "thumbsUp" ? 1 : 0);
    const displayThumbsDown = (selected.thumbsDownCount ?? 0) + (userRating === "thumbsDown" ? 1 : 0);
    const displayLikeCount = (selected.likedCount ?? 0) + (likedIds.includes(selected.id) ? 1 : 0);
    const displayShareCount = (selected.shareCount ?? 0) + (shareCounts[selected.id] ?? 0);
    const liked = likedIds.includes(selected.id);

    const handleShareClick = async () => {
      onShare(selected.id);
      const title = selected.title ?? "우즐시";
      const text = selected.title ? `${selected.title}\n\n${selected.body}` : selected.body;
      const url = typeof window !== "undefined" ? window.location.href : "";

      if (typeof window !== "undefined" && "share" in window.navigator) {
        try {
          await (window.navigator as Navigator).share({
            title,
            text: `${text.slice(0, 100)}...`,
            url,
          });
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            if (
              "clipboard" in window.navigator &&
              window.navigator.clipboard
            ) {
              await window.navigator.clipboard.writeText(
                `${url}\n이거 보고 웃으세요 :-)`,
              );
            }
          }
        }
      } else {
        if (
          typeof window !== "undefined" &&
          "clipboard" in window.navigator &&
          window.navigator.clipboard
        ) {
          await window.navigator.clipboard.writeText(
            `${text.slice(0, 80)}...\n${url}`,
          );
        }
      }
    };

    return (
      <div className="mx-auto max-w-2xl px-4">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mb-4 flex min-h-[48px] items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-2xl font-medium text-gray-900"
        >
          <ChevronLeft className="size-7" aria-hidden />
          목록으로
        </button>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-block rounded-lg px-3 py-1 text-lg font-medium ${
                    CATEGORY_COLOR[selected.category] ?? ""
                  }`}
                >
                  {CATEGORY_LABEL[selected.category] ?? selected.category}
                </span>
                {selected.title && (
                  <h2 className="mt-3 text-3xl font-semibold tracking-wide text-[#2C2416]">
                    {selected.title}
                  </h2>
                )}
              </div>
              <button
                type="button"
                onClick={() => onLikeToggle(selected.id)}
                aria-pressed={liked}
                aria-label={liked ? "좋아요 취소" : "좋아요"}
                className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl border-2 border-amber-900/15 bg-white/90 px-3 py-2 text-2xl"
              >
                <Heart className={`size-7 ${liked ? "fill-rose-600 text-rose-600" : "text-[#2C2416]"}`} aria-hidden />
                <span className="tabular-nums">{displayLikeCount}</span>
              </button>
            </div>

            {selected.createdAt && (
              <p className="text-lg text-[#4B5563]">
                {new Date(selected.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}

            {selected.tags && selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-lg text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <FormattedBody text={selected.body} collapseAfter={0} />
            </div>

            {selected.sourceName && (
              <p className="flex items-center gap-2 text-lg text-[#2C2416]/75">
                <ExternalLink className="size-5 shrink-0" aria-hidden />
                {selected.sourceUrl ? (
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    출처: {selected.sourceName}
                  </a>
                ) : (
                  <span>출처: {selected.sourceName}</span>
                )}
              </p>
            )}

            <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
              <div className="flex flex-wrap items-center gap-4" role="group" aria-label="게시글 평가">
                <button
                  type="button"
                  onClick={() => onRating(selected.id, "thumbsUp")}
                  aria-pressed={userRating === "thumbsUp"}
                  className={`flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-2xl transition-colors ${
                    userRating === "thumbsUp"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900 border border-gray-300"
                  }`}
                >
                  <ThumbsUp className="size-8 shrink-0" aria-hidden />
                  <span>{displayThumbsUp}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRating(selected.id, "thumbsDown")}
                  aria-pressed={userRating === "thumbsDown"}
                  className={`flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-2xl transition-colors ${
                    userRating === "thumbsDown"
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900 border border-gray-300"
                  }`}
                >
                  <ThumbsDown className="size-8 shrink-0" aria-hidden />
                  <span>{displayThumbsDown}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleShareClick}
                className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-gray-900 px-6 py-3 text-2xl font-medium text-white transition-colors hover:bg-gray-800"
              >
                <Share2 className="size-8" aria-hidden />
                공유하기
                <span className="rounded-full bg-white/25 px-3 py-0.5 text-xl">
                  {displayShareCount}
                </span>
              </button>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <ul className="overflow-hidden divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {cards.map((card) => {
          const liked = likedIds.includes(card.id);
          return (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => setSelectedId(card.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-100 active:bg-gray-200"
              >
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-lg font-medium ${CATEGORY_COLOR[card.category] ?? ""}`}>
                  {CATEGORY_LABEL[card.category] ?? card.category}
                </span>
                <span className="min-w-0 flex-1 truncate text-2xl font-medium text-[#111827]">
                  {card.title || card.body.slice(0, 40)}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-lg text-[#2C2416]/50">
                  {liked && <Heart className="size-5 fill-rose-500 text-rose-500" aria-hidden />}
                  <ThumbsUp className="size-5" aria-hidden />
                  <span>{card.thumbsUpCount ?? 0}</span>
                </span>
              </button>
            </li>
          );
        })}
        {cards.length === 0 && (
          <li className="px-5 py-12 text-center text-2xl text-[#6B7280]">
            글이 없어요.
          </li>
        )}
      </ul>
    </div>
  );
}
