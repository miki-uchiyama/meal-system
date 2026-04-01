"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ResidentMeal } from "@/types/meal";
import ResidentRow from "@/components/ResidentRow";

type SaveMessage = {
  type: "success" | "error";
  text: string;
};

function toResidentMeal(r: { id: number; name: string }): ResidentMeal {
  return { id: r.id, name: r.name, provided: "×", staple: "無", side: "無", allergy: "無" };
}

export default function MealInputPage() {
  const [residents, setResidents] = useState<ResidentMeal[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<SaveMessage | null>(null);

  useEffect(() => {
    fetch("/api/residents")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setResidents(json.data.map(toResidentMeal));
        }
      })
      .catch(() => {
        setMessage({ type: "error", text: "利用者の読み込みに失敗しました" });
      })
      .finally(() => setLoadingResidents(false));
  }, []);

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
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight">給食実績入力</h1>
            <p className="text-sm text-blue-100">{todayDisplay}</p>
          </div>
          <Link
            href="/residents"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 active:bg-blue-700 text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            利用者管理
          </Link>
        </div>
      </header>

      {/* 利用者一覧（ここだけスクロール） */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-4">
          {loadingResidents ? (
            <p className="text-center text-gray-400 py-10">読み込み中...</p>
          ) : residents.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-gray-400">利用者が登録されていません</p>
              <Link
                href="/residents"
                className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm active:bg-blue-700"
              >
                利用者を追加する
              </Link>
            </div>
          ) : (
            residents.map((resident) => (
              <ResidentRow
                key={resident.id}
                resident={resident}
                onChange={handleChange}
              />
            ))
          )}
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
