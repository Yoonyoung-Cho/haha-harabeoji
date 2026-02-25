import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리들의 즐거운 시간 (우즐시)",
  description: "매일 아침, 당신의 입가에 피어나는 작은 미소",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-[#111827] text-[26px] md:text-[28px] antialiased">
        {children}
      </body>
    </html>
  );
}
