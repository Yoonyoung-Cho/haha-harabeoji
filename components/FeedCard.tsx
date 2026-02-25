"use client";

import { useState } from "react";
import { ExternalLink, Heart, Share2, Star } from "lucide-react";
import type { ContentCard } from "@/types/content";
import type { RatingType } from "@/types/reaction";
import { FormattedBody } from "./FormattedBody";

interface FeedCardProps {
  card: ContentCard;
  liked: boolean;
  onLikeToggle: () => void;
  displayLikeCount: number;
  userRating: RatingType | null;
  onRating: (rating: RatingType) => void;
  onAfterRating?: () => void;
  displayThumbsUp: number;
  displayShareCount: number;
  onShare: () => void;
}

const SHARE_TEXT = "이거 보고 웃으세요 :-)";

export function FeedCard({
  card,
  liked,
  onLikeToggle,
  displayLikeCount,
  userRating,
  onRating,
  onAfterRating,
  displayThumbsUp,
  displayShareCount,
  onShare,
}: FeedCardProps) {
  const [shareOpen, setShareOpen] = useState(false);

  const shareTitle = card.title ?? "우리들의 즐거운 시간 (우즐시)";
  const shareText = card.title ? `${card.title}\n\n${card.body}` : card.body;

  const handleRating = (r: RatingType) => {
    onRating(r);
    onAfterRating?.();
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShareKakao = async () => {
    onShare();
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator).share?.({
          title: shareTitle,
          text: `${shareText.slice(0, 100)}... ${SHARE_TEXT}`,
          url: shareUrl,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
      }
      if (typeof window !== "undefined") {
        window.alert("카카오톡에서 링크를 붙여넣어 공유해 주세요.");
      }
    } catch (err) {
      // 사용자가 공유를 취소한 경우 등은 조용히 무시
    } finally {
      setShareOpen(false);
    }
  };

  const handleShareSms = () => {
    onShare();
    if (typeof window !== "undefined") {
      const body = encodeURIComponent(`${shareTitle}\n${shareUrl}`);
      window.location.href = `sms:?body=${body}`;
    }
    setShareOpen(false);
  };

  const handleShareLink = async () => {
    onShare();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
        if (typeof window !== "undefined") {
          window.alert("링크가 복사되었습니다.");
        }
      }
    } catch {
      // 무시
    } finally {
      setShareOpen(false);
    }
  };

  return (
    <article
      id={`card-${card.id}`}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm scroll-mt-4"
      aria-labelledby={card.title ? `card-title-${card.id}` : undefined}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {card.title && (
              <h2
                id={`card-title-${card.id}`}
                className="text-4xl font-semibold tracking-wide text-[#111827]"
              >
                {card.title}
              </h2>
            )}
          </div>
        </div>

        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-lg text-gray-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <FormattedBody text={card.body} collapseAfter={8} />
        {/* 출처: 본문 아래, 평가/공유 위에 표시 */}
        {card.sourceName && (
          <p className="flex items-center gap-2 text-lg text-[#4B5563]">
            <ExternalLink className="size-5 shrink-0" aria-hidden />
            {card.sourceUrl ? (
              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                출처: {card.sourceName}
              </a>
            ) : (
              <span>출처: {card.sourceName}</span>
            )}
          </p>
        )}

        <div className="mt-4 space-y-4">
          <div
            className="flex flex-row gap-4"
            role="group"
            aria-label="좋아요, 저장, 공유"
          >
            <button
              type="button"
              onClick={() => handleRating("thumbsUp")}
              aria-pressed={userRating === "thumbsUp"}
              className={`flex min-h-[72px] flex-1 items-center justify-center gap-3 rounded-xl px-5 py-4 text-2xl font-medium transition-colors ${
                userRating === "thumbsUp"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-900 border border-gray-300"
              }`}
            >
              <Heart
                className={`size-8 ${
                  userRating === "thumbsUp" ? "fill-white text-white" : "text-rose-600"
                }`}
                aria-hidden
              />
              <span>좋아요 {displayThumbsUp}</span>
            </button>
            <button
              type="button"
              onClick={onLikeToggle}
              aria-pressed={liked}
              className={`flex min-h-[72px] flex-1 items-center justify-center gap-3 rounded-xl px-5 py-4 text-2xl font-medium transition-colors ${
                liked
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-900 border border-gray-300"
              }`}
            >
              <Star
                className={`size-8 ${
                  liked ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"
                }`}
                aria-hidden
              />
              <span>저장 {displayLikeCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setShareOpen((v) => !v)}
              className="flex min-h-[72px] flex-1 items-center justify-center gap-3 rounded-xl bg-gray-900 px-5 py-4 text-2xl font-medium text-white transition-colors hover:bg-gray-800"
              aria-expanded={shareOpen}
            >
              <Share2 className="size-8 shrink-0" aria-hidden />
              <span>공유 {displayShareCount}</span>
            </button>
          </div>

          {shareOpen && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xl text-gray-900">
              <p className="mb-2 font-semibold">어디로 보내실까요?</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleShareKakao}
                  className="flex min-h-[48px] items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-left hover:bg-gray-200"
                >
                  <span>카카오톡</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareSms}
                  className="flex min-h-[48px] items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-left hover:bg-gray-200"
                >
                  <span>문자</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="flex min-h-[48px] items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-left hover:bg-gray-200"
                >
                  <span>링크 복사</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
