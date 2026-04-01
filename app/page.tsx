"use client";

import { useState } from "react";
import type { ResidentMeal } from "@/types/meal";
import { DUMMY_RESIDENTS } from "@/types/meal";
import ResidentRow from "@/components/ResidentRow";
import { supabase } from "@/lib/supabase";

type SaveMessage = {
  type: "success" | "error";
  text: string;
};

export default function MealInputPage() {
  const [residents, setResidents] = useState<ResidentMeal[]>(DUMMY_RESIDENTS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<SaveMessage | null>(null);

  const todayDate = new Date();
  const todayDisplay = todayDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const todayISO = todayDate.toISOString().slice(0, 10);

  const handleChange = (updated: ResidentMeal) => {
    setResidents((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const records = residents.map((r) => ({
      meal_date: todayISO,
      resident_name: r.name,
      provided: r.provided === "○",
      staple_amount: r.staple,
      side_amount: r.side,
      allergy: r.allergy,
    }));

    const { error } = await supabase.from("meal_records").insert(records);

    setSaving(false);
    if (error) {
      setMessage({
        type: "error",
        text: `保存に失敗しました。再度お試しください。（${error.message}）`,
      });
    } else {
      setMessage({
        type: "success",
        text: `${residents.length}名分のデータを保存しました！`,
      });
    }
  };

  return (
    /*
     * h-dvh + flex-col + overflow-hidden で外側コンテナを画面高さに固定する。
     * sticky をやめてフレックスレイアウトで header/footer を固定し、
     * main だけが overflow-y-auto でスクロールする構造にする。
     * iOS Safari の sticky-in-flex ヒットテストずれバグを回避する。
     */
    <div className="flex flex-col overflow-hidden bg-gray-50" style={{ height: "100dvh" }}>
      {/* ヘッダー（sticky 不要 ― flex shrink-0 で上部固定） */}
      <header className="shrink-0 bg-blue-600 text-white shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-bold leading-tight">給食実績入力</h1>
          <p className="text-sm text-blue-100">{todayDisplay}</p>
        </div>
      </header>

      {/* 利用者一覧（ここだけスクロール） */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-4">
          {residents.map((resident) => (
            <ResidentRow
              key={resident.id}
              resident={resident}
              onChange={handleChange}
            />
          ))}

          {/* メッセージ */}
          {message && (
            <div
              className={[
                "p-4 rounded-xl text-sm font-medium text-center",
                message.type === "success"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200",
              ].join(" ")}
            >
              {message.type === "success" ? "✓ " : "⚠ "}
              {message.text}
            </div>
          )}
        </div>
      </main>

      {/* フッター（sticky 不要 ― flex shrink-0 で下部固定） */}
      <footer className="shrink-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <button
            onPointerDown={saving ? undefined : handleSave}
            disabled={saving}
            className={[
              "w-full min-h-[52px] rounded-xl font-bold text-base text-white",
              "transition-colors duration-150",
              saving
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 active:bg-blue-700",
            ].join(" ")}
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </footer>
    </div>
  );
}
