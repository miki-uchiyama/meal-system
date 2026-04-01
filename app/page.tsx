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
      setMessage({ type: "error", text: `保存に失敗しました。再度お試しください。（${error.message}）` });
    } else {
      setMessage({ type: "success", text: `${residents.length}名分のデータを保存しました！` });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-blue-600 text-white shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-bold leading-tight">給食実績入力</h1>
          <p className="text-sm text-blue-100">{todayDisplay}</p>
        </div>
      </header>

      {/* 利用者一覧 */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-5 space-y-5 pb-4">
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
      </main>

      {/* 保存ボタン（固定フッター） */}
      <footer className="sticky bottom-0 z-20 bg-white border-t border-gray-200 px-4 py-3 w-full">
        <div className="max-w-lg mx-auto">
        <button
          onClick={handleSave}
          disabled={saving}
          className={[
            "w-full min-h-[52px] rounded-xl font-bold text-base text-white",
            "relative z-10 transition-colors duration-150",
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
