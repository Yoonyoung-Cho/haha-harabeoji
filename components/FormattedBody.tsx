"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FormattedBodyProps {
  text: string;
  className?: string;
  /** 접기 기준 줄 수 (기본 15줄). 0이면 접기 없음 */
  collapseAfter?: number;
}

// 정규식 수정: 앞뒤 공백 허용 및 유연한 매칭
const IMG_MARKER = /!\[img\]\(([^)]+)\)/;

function renderLines(lines: string[]) {
  return lines.map((line, i) => {
    const imgMatch = line.match(IMG_MARKER);
    if (imgMatch) {
      return (
        <img
          key={i}
          src={imgMatch[1]}
          alt=""
          className="my-3 max-h-96 w-full rounded-xl object-contain bg-black/5"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      );
    }
    if (!line.trim()) return <div key={i} className="h-3" />;
    return <p key={i}>{line}</p>;
  });
}

export function FormattedBody({ text, className = "", collapseAfter = 15 }: FormattedBodyProps) {
  const [expanded, setExpanded] = useState(false);
  const allLines = text.split("\n");
  const shouldCollapse = collapseAfter > 0 && allLines.length > collapseAfter;
  const visibleLines = shouldCollapse && !expanded ? allLines.slice(0, collapseAfter) : allLines;

  return (
    <div className={`space-y-2 text-2xl leading-relaxed text-[#2C2416] md:text-3xl ${className}`}>
      {renderLines(visibleLines)}

      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xl font-medium text-amber-700 transition-colors hover:bg-amber-100"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-6" aria-hidden />
              접기
            </>
          ) : (
            <>
              <ChevronDown className="size-6" aria-hidden />
              더보기
            </>
          )}
        </button>
      )}
    </div>
  );
}
