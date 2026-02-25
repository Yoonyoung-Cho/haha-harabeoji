"use client";

import { BookOpen, HeartPulse, LayoutGrid, Newspaper, Smile } from "lucide-react";

export type CategoryFilter = "all" | "humor" | "health" | "wisdom" | "history";

const LABELS: Record<CategoryFilter, string> = {
  all: "전체",
  humor: "유머",
  health: "건강",
  wisdom: "지혜",
  history: "역사",
};

const ICONS: Record<CategoryFilter, typeof LayoutGrid> = {
  all: LayoutGrid,
  humor: Smile,
  health: HeartPulse,
  wisdom: Newspaper,
  history: BookOpen,
};

interface CategoryTabsProps {
  value: CategoryFilter;
  onChange: (v: CategoryFilter) => void;
}

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  const tabs: CategoryFilter[] = ["all", "humor", "history", "health", "wisdom"];

  return (
    <nav
      className="flex flex-wrap gap-3 p-4"
      role="tablist"
      aria-label="카테고리 선택"
    >
      {tabs.map((tab) => {
        const isSelected = value === tab;
        const Icon = ICONS[tab];
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab)}
            className={`
              min-h-[56px] min-w-[56px] rounded-xl px-6 py-3 text-2xl font-medium
              transition-colors
              ${
                isSelected
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <Icon className="size-8 shrink-0" aria-hidden />
              <span>{LABELS[tab]}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
