"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ResidentSummary = {
  name: string;
  mealCount: number;
  fee: number;
  days: Record<number, string>;
};

type SummaryData = {
  data: ResidentSummary[];
  totalMeals: number;
  totalFee: number;
  daysInMonth: number;
  year: number;
  month: number;
};

const MEAL_FEE = 250;
const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type CellStyle = { bg: string; text: string; label: string };

function getCellStyle(status: string | undefined): CellStyle {
  switch (status) {
    case "有":  return { bg: "bg-green-100",  text: "text-green-700 font-bold", label: "○" };
    case "無":  return { bg: "bg-gray-50",    text: "text-gray-300",             label: "×" };
    case "弁当": return { bg: "bg-amber-50",  text: "text-amber-500 font-bold", label: "弁" };
    case "休":  return { bg: "bg-violet-50",  text: "text-violet-400 font-bold", label: "休" };
    default:    return { bg: "",              text: "text-gray-200",             label: "" };
  }
}

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

  const handlePrev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const handleNext = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };
  const isNextDisabled = year > todayYear || (year === todayYear && month >= todayMonth);

  const daysInMonth = summary?.daysInMonth ?? (year > 0 && month > 0 ? new Date(year, month, 0).getDate() : 30);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white shadow-md shrink-0">
        <div className="px-6 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight">月次給食費集計</h1>
            <p className="text-xs text-blue-100">1食 {MEAL_FEE.toLocaleString()}円 × 食数（「有」の日のみカウント）</p>
          </div>
        </div>
      </header>

      {/* コントロールバー */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shrink-0">
        {/* 月移動 */}
        <button
          onClick={handlePrev}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
        >
          ← 前月
        </button>
        <div className="flex items-center gap-1">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base font-semibold text-gray-800 bg-white outline-none focus:ring-2 focus:ring-blue-400"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-base font-semibold text-gray-800 bg-white outline-none focus:ring-2 focus:ring-blue-400"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors disabled:opacity-30"
        >
          翌月 →
        </button>

        {/* 凡例 */}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          {(["有", "弁当", "休", "無"] as const).map((s) => {
            const { bg, text, label } = getCellStyle(s);
            return (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${bg} ${text}`}>
                  {label}
                </span>
                {s}
              </span>
            );
          })}
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded text-xs text-gray-300 border border-dashed border-gray-200">
              —
            </span>
            未記録
          </span>
        </div>
      </div>

      {/* テーブルエリア */}
      <main className="flex-1 px-6 py-5 overflow-auto">
        {loading && (
          <p className="text-center text-gray-400 py-16 text-base">読み込み中...</p>
        )}
        {error && (
          <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 text-center">
            ⚠ {error}
          </div>
        )}

        {!loading && !error && summary && (
          summary.data.length === 0 ? (
            <p className="text-center text-gray-400 py-16">利用者が登録されていません</p>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full border-collapse text-sm" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  {/* 名前列 */}
                  <col style={{ width: "140px", minWidth: "120px" }} />
                  {/* 日ごと列 */}
                  {days.map((d) => <col key={d} />)}
                  {/* 食数・給食費 */}
                  <col style={{ width: "54px" }} />
                  <col style={{ width: "88px" }} />
                </colgroup>

                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-3 py-2.5 text-left font-bold text-sm border-r border-blue-500">
                      利用者名
                    </th>
                    {days.map((d) => {
                      const dow = new Date(year, month - 1, d).getDay();
                      const isSun = dow === 0;
                      const isSat = dow === 6;
                      return (
                        <th
                          key={d}
                          className="py-1.5 text-center font-semibold border-r border-blue-500 last:border-r-0"
                        >
                          <div className={`text-xs leading-tight ${isSun ? "text-red-300" : isSat ? "text-sky-200" : ""}`}>
                            {d}
                          </div>
                          <div className={`text-[10px] leading-tight opacity-80 ${isSun ? "text-red-300" : isSat ? "text-sky-200" : ""}`}>
                            {DOW_LABELS[dow]}
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-2.5 text-center font-bold text-xs border-r border-blue-500">
                      食数
                    </th>
                    <th className="py-2.5 text-center font-bold text-xs">
                      給食費
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summary.data.map((resident, idx) => (
                    <tr
                      key={resident.name}
                      className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}
                    >
                      <td className="px-3 py-2.5 font-medium text-gray-800 border-r border-gray-100 truncate text-sm">
                        {resident.name}
                      </td>
                      {days.map((d) => {
                        const status = resident.days[d];
                        const { bg, text, label } = getCellStyle(status);
                        const dow = new Date(year, month - 1, d).getDay();
                        const weekendBg = dow === 0 ? "bg-red-50" : dow === 6 ? "bg-slate-50" : "";
                        const cellBg = status ? bg : weekendBg;
                        return (
                          <td
                            key={d}
                            className={`text-center border-r border-gray-100 last:border-r-0 p-0 ${cellBg}`}
                          >
                            <span className={`block py-2 text-xs ${text}`}>
                              {label}
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-center border-r border-gray-100 py-2.5 font-bold">
                        <span className={resident.mealCount > 0 ? "text-blue-600" : "text-gray-300"}>
                          {resident.mealCount}
                        </span>
                      </td>
                      <td className="text-right px-3 py-2.5 font-bold">
                        <span className={resident.mealCount > 0 ? "text-gray-800" : "text-gray-300"}>
                          {resident.fee > 0 ? `¥${resident.fee.toLocaleString()}` : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* 日ごと合計行 */}
                  <tr className="bg-blue-600 text-white font-bold border-t-2 border-blue-700">
                    <td className="px-3 py-2.5 text-sm border-r border-blue-500">
                      合計（食数）
                    </td>
                    {days.map((d) => {
                      const count = summary.data.filter((r) => r.days[d] === "有").length;
                      return (
                        <td key={d} className="text-center border-r border-blue-500 last:border-r-0 py-2">
                          {count > 0 ? (
                            <span className="text-xs font-bold text-white">{count}</span>
                          ) : (
                            <span className="text-xs text-blue-400">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center border-r border-blue-500 py-2.5 text-base">
                      {summary.totalMeals}
                    </td>
                    <td className="text-right px-3 py-2.5 text-base">
                      ¥{summary.totalFee.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )}
      </main>
    </div>
  );
}
