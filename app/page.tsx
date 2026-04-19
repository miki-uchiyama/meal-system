"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FoodAmount, ProvidedStatus, ResidentMeal } from "@/types/meal";
import ResidentRow from "@/components/ResidentRow";

type SaveMessage = {
  type: "success" | "error";
  text: string;
};

type SavedMealRow = {
  resident_name: string;
  provided: string;
  staple_amount: string;
  side_amount: string;
  allergy: string;
};

function toResidentMeal(r: {
  id: number;
  name: string;
  allergy?: string;
  allergy_note?: string;
  default_provided?: string;
}): ResidentMeal {
  const validProvided = ["有", "無", "弁当", "休"];
  return {
    id: r.id,
    name: r.name,
    provided: (validProvided.includes(r.default_provided ?? "") ? r.default_provided : "無") as ResidentMeal["provided"],
    staple: "",
    side: "",
    allergy: r.allergy === "有" ? "有" : "無",
    allergy_note: r.allergy_note ?? "",
  };
}

function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function parseProvided(v: string, fallback: ProvidedStatus): ProvidedStatus {
  return (["有", "無", "弁当", "休"] as const).includes(v as ProvidedStatus) ? (v as ProvidedStatus) : fallback;
}

const KNOWN_FOOD_AMOUNTS = ["完食", "少量", "半分", "多量", "全量", "無", ""] as const satisfies readonly FoodAmount[];

function parseFoodAmount(v: string): FoodAmount {
  return (KNOWN_FOOD_AMOUNTS as readonly string[]).includes(v) ? (v as FoodAmount) : "";
}

function mergeResidentWithSave(base: ResidentMeal, saved: SavedMealRow | undefined): ResidentMeal {
  if (!saved) return base;
  return {
    ...base,
    provided: parseProvided(saved.provided, base.provided),
    staple: parseFoodAmount(saved.staple_amount),
    side: parseFoodAmount(saved.side_amount),
  };
}

export default function MealInputPage() {
  const [residents, setResidents] = useState<ResidentMeal[]>([]);
  const [savedRows, setSavedRows] = useState<SavedMealRow[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [loadingDayRecords, setLoadingDayRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<SaveMessage | null>(null);

  const [todayISO, setTodayISO] = useState<string>("");
  const [selectedISO, setSelectedISO] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<ResidentMeal | null>(null);

  const savedByName = useMemo(() => {
    const m: Record<string, SavedMealRow> = {};
    for (const row of savedRows) {
      m[row.resident_name] = row;
    }
    return m;
  }, [savedRows]);

  const filteredResidents = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return residents;
    return residents.filter((r) => r.name.includes(q));
  }, [residents, searchQuery]);

  useEffect(() => {
    const today = toLocalISO(new Date());
    setTodayISO(today);
    setSelectedISO(today);
  }, []);

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

  const refreshDayRecords = useCallback(async (date: string) => {
    if (!date) return;
    setLoadingDayRecords(true);
    try {
      const res = await fetch(`/api/meal-records-by-date?date=${encodeURIComponent(date)}`);
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: `その日の記録の読み込みに失敗しました。（${json.error ?? res.status}）` });
        setSavedRows([]);
        return;
      }
      setSavedRows(json.data ?? []);
    } catch (err) {
      setMessage({ type: "error", text: `通信エラーが発生しました。（${String(err)}）` });
      setSavedRows([]);
    } finally {
      setLoadingDayRecords(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedISO) return;
    setEditingId(null);
    setEditingDraft(null);
    setSearchQuery("");
    setMessage(null);
    void refreshDayRecords(selectedISO);
  }, [selectedISO, refreshDayRecords]);

  const handlePrevDay = () => {
    if (!selectedISO) return;
    const [y, m, d] = selectedISO.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedISO(toLocalISO(prev));
  };

  const handleNextDay = () => {
    if (!selectedISO || selectedISO >= todayISO) return;
    const [y, m, d] = selectedISO.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedISO(toLocalISO(next));
  };

  const openEditor = (id: number) => {
    const base = residents.find((r) => r.id === id);
    if (!base) return;
    setEditingDraft(mergeResidentWithSave(base, savedByName[base.name]));
    setEditingId(id);
    setMessage(null);
  };

  const closeEditor = () => {
    setEditingId(null);
    setEditingDraft(null);
    setMessage(null);
  };

  const handleDraftChange = (updated: ResidentMeal) => {
    setEditingDraft(updated);
    setMessage(null);
  };

  const handleSaveOne = async () => {
    if (!editingDraft || !selectedISO) return;
    setSaving(true);
    setMessage(null);

    const record = {
      meal_date: selectedISO,
      resident_name: editingDraft.name,
      provided: editingDraft.provided,
      staple_amount: editingDraft.staple,
      side_amount: editingDraft.side,
      allergy: editingDraft.allergy,
    };

    try {
      const res = await fetch("/api/save-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([record]),
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: `保存に失敗しました。（${json.error}）` });
      } else {
        setResidents((prev) => prev.map((r) => (r.id === editingDraft.id ? editingDraft : r)));
        setMessage({ type: "success", text: "保存しました" });
        setEditingId(null);
        setEditingDraft(null);
        await refreshDayRecords(selectedISO);
      }
    } catch (err) {
      setMessage({ type: "error", text: `通信エラーが発生しました。（${String(err)}）` });
    } finally {
      setSaving(false);
    }
  };

  const listBusy = loadingResidents || loadingDayRecords;

  return (
    <div className="flex flex-col overflow-hidden bg-gray-50" style={{ height: "100dvh" }}>
      <header className="shrink-0 bg-blue-600 text-white shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {editingId != null ? (
            <>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  closeEditor();
                }}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500 active:bg-blue-700"
                aria-label="一覧に戻る"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h1 className="text-lg font-bold leading-tight truncate flex-1 text-center pr-10">
                {editingDraft?.name ?? ""}
              </h1>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold leading-tight shrink-0">給食実績入力</h1>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/monthly-summary"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 active:bg-blue-700 text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  月次集計
                </Link>
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
            </>
          )}
        </div>

        {editingId == null && (
          <div className="max-w-lg mx-auto px-4 pb-3 flex items-center gap-2">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handlePrevDay();
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500 active:bg-blue-700"
              aria-label="前日"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <label className="flex-1 relative">
              <input
                type="date"
                value={selectedISO}
                max={todayISO}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedISO(e.target.value);
                    setMessage(null);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-2 bg-blue-500 rounded-xl px-3 py-2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-sm font-medium">
                  {selectedISO ? formatDateDisplay(selectedISO) : "　"}
                </span>
                {selectedISO && selectedISO === todayISO && (
                  <span className="text-xs bg-white text-blue-600 font-bold px-1.5 py-0.5 rounded-md leading-none">今日</span>
                )}
              </div>
            </label>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleNextDay();
              }}
              disabled={!selectedISO || selectedISO >= todayISO}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500 active:bg-blue-700 disabled:opacity-30"
              aria-label="翌日"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-4">
          {editingId != null && editingDraft ? (
            <ResidentRow resident={editingDraft} onChange={handleDraftChange} showNameSection={false} />
          ) : listBusy ? (
            <p className="text-center text-gray-400 py-10">読み込み中...</p>
          ) : residents.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-gray-400">利用者が登録されていません</p>
              <Link href="/residents" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm active:bg-blue-700">
                利用者を追加する
              </Link>
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-10 -mx-1 px-1 pb-2 bg-gray-50 pt-0">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="名前で検索"
                  enterKeyHint="search"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <ul className="space-y-2">
                {filteredResidents.map((r) => {
                  const done = Boolean(savedByName[r.name]);
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => openEditor(r.id)}
                        style={{ touchAction: "pan-y" }}
                        className="w-full flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-sm active:bg-gray-50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                          {done ? (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">済</span>
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1 text-lg font-bold text-gray-800">{r.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-gray-300">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {filteredResidents.length === 0 && (
                <p className="text-center text-gray-400 py-6">該当する利用者がいません</p>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-4">
        <div className="max-w-lg mx-auto space-y-2">
          {message && editingId == null && (
            <div
              className={[
                "rounded-xl p-3 text-center text-sm font-medium",
                message.type === "success"
                  ? "border border-green-200 bg-green-100 text-green-700"
                  : "border border-red-200 bg-red-100 text-red-700",
              ].join(" ")}
            >
              {message.type === "success" ? "✓ " : "⚠ "}
              {message.text}
            </div>
          )}

          {editingId != null && (
            <>
              {message && message.type === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-100 p-3 text-center text-sm font-medium text-red-700">
                  ⚠ {message.text}
                </div>
              )}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (!saving) void handleSaveOne();
                }}
                disabled={saving}
                className={[
                  "min-h-[52px] w-full rounded-xl text-base font-bold text-white transition-colors duration-150",
                  saving ? "cursor-not-allowed bg-blue-400" : "bg-blue-600 active:bg-blue-700",
                ].join(" ")}
              >
                {saving ? "保存中..." : "保存する"}
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
