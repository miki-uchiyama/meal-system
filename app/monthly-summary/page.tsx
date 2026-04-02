"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ResidentSummary = {
  name: string;
  mealCount: number;
  fee: number;
};

type SummaryData = {
  data: ResidentSummary[];
  totalMeals: number;
  totalFee: number;
};

const MEAL_FEE = 250;

export default function MonthlySummaryPage() {
  const [year, setYear] = useState(0);
  const [month, setMonth] = useState(0);
  const [todayYear, setTodayYear] = useState(0);
  const [todayMonth, setTodayMonth] = useState(0);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    setTodayYear(today.getFullYear());
    setTodayMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  }, []);

  const fetchSummary = async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch(`/api/monthly-summary?year=${y}&month=${m}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSummary(json);
    } catch (err) {
      setError(`読み込みに失敗しました（${String(err)}）`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (year === 0 || month === 0) return;
    fetchSummary(year, month);
  }, [year, month]);

  const yearOptions = todayYear > 0
    ? Array.from({ length: 5 }, (_, i) => todayYear - 2 + i)
    : [];
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const handlePrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const handleNext = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };
  const isNextDisabled = year > todayYear || (year === todayYear && month >= todayMonth);

  return (
    <div className="flex flex-col overflow-hidden bg-gray-50" style={{ height: "100dvh" }}>
      {/* ヘッダー */}
      <header className="shrink-0 bg-blue-600 text-white shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500 active:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">月次給食費集計</h1>
            <p className="text-xs text-blue-100">1食 {MEAL_FEE.toLocaleString()}円 × 食数</p>
          </div>
        </div>
      </header>

      {/* 月選択 */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); handlePrev(); }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200"
            aria-label="前月"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex-1 flex items-center justify-center gap-1">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-base font-medium text-gray-800 bg-white outline-none focus:ring-2 focus:ring-blue-400"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-base font-medium text-gray-800 bg-white outline-none focus:ring-2 focus:ring-blue-400"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); if (!isNextDisabled) handleNext(); }}
            disabled={isNextDisabled}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 disabled:opacity-30"
            aria-label="翌月"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
          {loading && (
            <p className="text-center text-gray-400 py-10">読み込み中...</p>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 text-center">
              ⚠ {error}
            </div>
          )}

          {!loading && !error && summary && (
            <>
              {summary.data.length === 0 ? (
                <p className="text-center text-gray-400 py-10">利用者が登録されていません</p>
              ) : (
                <>
                  {/* テーブルヘッダー */}
                  <div className="bg-blue-600 text-white rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] px-4 py-2.5 text-sm font-bold gap-4">
                      <span>利用者名</span>
                      <span className="text-right w-12">食数</span>
                      <span className="text-right w-20">給食費</span>
                    </div>
                  </div>

                  {/* 各利用者 */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                    {summary.data.map((r) => (
                      <div
                        key={r.name}
                        className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-3.5 gap-4"
                      >
                        <span className="text-base font-medium text-gray-800">{r.name}</span>
                        <span className={[
                          "text-right w-12 text-base font-bold",
                          r.mealCount > 0 ? "text-blue-600" : "text-gray-300",
                        ].join(" ")}>
                          {r.mealCount}
                        </span>
                        <span className={[
                          "text-right w-20 text-base font-bold",
                          r.mealCount > 0 ? "text-gray-800" : "text-gray-300",
                        ].join(" ")}>
                          {r.fee > 0 ? `¥${r.fee.toLocaleString()}` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 合計 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-4 gap-4">
                      <span className="text-base font-bold text-blue-800">合計</span>
                      <span className="text-right w-12 text-base font-bold text-blue-700">
                        {summary.totalMeals}
                      </span>
                      <span className="text-right w-20 text-lg font-bold text-blue-700">
                        ¥{summary.totalFee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-gray-400 pt-1">
                    ※ 提供あり（○）の日のみカウントします
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
