"use client";

import { useState } from "react";
import type { ResidentMeal } from "@/types/meal";
import { DUMMY_RESIDENTS } from "@/types/meal";
import ResidentRow from "@/components/ResidentRow";
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

    try {
      const res = await fetch("/api/save-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: `保存に失敗しました。（${json.error}）` });
      } else {
        setMessage({ type: "success", text: `${json.data.length}名分のデータを保存しました！` });
      }
    } catch (err) {
      setMessage({ type: "error", text: `通信エラーが発生しました。（${String(err)}）` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden bg-gray-50" style={{ height: "100dvh" }}>
      {/* ヘッダー */}
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

        </div>
      </main>

      {/* フッター：メッセージ＋保存ボタン（常に画面下に固定） */}
      <footer className="shrink-0 bg-white border-t border-gray-200 px-4 pt-3 pb-4 space-y-2">
        <div className="max-w-lg mx-auto space-y-2">
          {/* メッセージ（スクロール不要で常に見える） */}
          {message && (
            <div
              className={[
                "p-3 rounded-xl text-sm font-medium text-center",
                message.type === "success"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200",
              ].join(" ")}
            >
              {message.type === "success" ? "✓ " : "⚠ "}
              {message.text}
            </div>
          )}

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              if (!saving) handleSave();
            }}
            disabled={saving}
            className={[
              "w-full min-h-[52px] rounded-xl font-bold text-base text-white",
              "transition-colors duration-150",
              saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 active:bg-blue-700",
            ].join(" ")}
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </footer>
    </div>
  );
}
