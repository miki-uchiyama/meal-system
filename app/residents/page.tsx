"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Resident, ResidentAllergy } from "@/types/resident";

type Message = { type: "success" | "error"; text: string };

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);

  // 追加フォーム
  const [newName, setNewName] = useState("");
  const [newAllergy, setNewAllergy] = useState<ResidentAllergy>("無");
  const [newAllergyNote, setNewAllergyNote] = useState("");
  const [adding, setAdding] = useState(false);

  // 編集フォーム
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingAllergy, setEditingAllergy] = useState<ResidentAllergy>("無");
  const [editingAllergyNote, setEditingAllergyNote] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const newNameRef = useRef<HTMLInputElement>(null);

  const showMessage = (msg: Message) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchResidents = async () => {
    try {
      const res = await fetch("/api/residents");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResidents(json.data);
    } catch (err) {
      showMessage({ type: "error", text: `読み込みに失敗しました（${String(err)}）` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const nextOrder = residents.length > 0
        ? Math.max(...residents.map((r) => r.display_order)) + 1
        : 0;
      const res = await fetch("/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          display_order: nextOrder,
          allergy: newAllergy,
          allergy_note: newAllergy === "有" ? newAllergyNote.trim() : "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewName("");
      setNewAllergy("無");
      setNewAllergyNote("");
      showMessage({ type: "success", text: `「${name}」を追加しました` });
      await fetchResidents();
    } catch (err) {
      showMessage({ type: "error", text: `追加に失敗しました（${String(err)}）` });
    } finally {
      setAdding(false);
    }
  };

  const handleEditSave = async (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/residents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          allergy: editingAllergy,
          allergy_note: editingAllergy === "有" ? editingAllergyNote.trim() : "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEditingId(null);
      showMessage({ type: "success", text: "利用者情報を更新しました" });
      await fetchResidents();
    } catch (err) {
      showMessage({ type: "error", text: `更新に失敗しました（${String(err)}）` });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/residents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      setDeleteConfirmId(null);
      showMessage({ type: "success", text: "削除しました" });
      await fetchResidents();
    } catch (err) {
      showMessage({ type: "error", text: `削除に失敗しました（${String(err)}）` });
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= residents.length) return;

    const newList = [...residents];
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setResidents(newList);

    try {
      const res = await fetch("/api/residents/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newList.map((r) => r.id) }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
    } catch (err) {
      showMessage({ type: "error", text: `並び替えに失敗しました（${String(err)}）` });
      await fetchResidents();
    }
  };

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
            <h1 className="text-lg font-bold leading-tight">利用者管理</h1>
            <p className="text-xs text-blue-100">利用者の追加・編集・削除・並び替え</p>
          </div>
        </div>
      </header>

      {/* 利用者一覧（スクロール領域） */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
          {loading && (
            <p className="text-center text-gray-400 py-10">読み込み中...</p>
          )}

          {!loading && residents.length === 0 && (
            <p className="text-center text-gray-400 py-10">利用者が登録されていません</p>
          )}

          {residents.map((resident, index) => (
            <div
              key={resident.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {editingId === resident.id ? (
                /* 編集モード */
                <div className="p-4 space-y-3">
                  {/* 名前入力 */}
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleEditSave(resident.id)}
                    placeholder="利用者名"
                    className="w-full border border-blue-300 rounded-xl px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />

                  {/* アレルギー 有/無 */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-500">アレルギー</span>
                    <div className="flex gap-2">
                      {(["無", "有"] as ResidentAllergy[]).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onPointerDown={(e) => { e.preventDefault(); setEditingAllergy(val); }}
                          className={[
                            "flex-1 min-h-[44px] rounded-xl text-base font-bold transition-colors",
                            editingAllergy === val
                              ? val === "有"
                                ? "bg-orange-500 text-white"
                                : "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-500",
                          ].join(" ")}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* アレルギー内容（有の場合のみ） */}
                  {editingAllergy === "有" && (
                    <input
                      type="text"
                      value={editingAllergyNote}
                      onChange={(e) => setEditingAllergyNote(e.target.value)}
                      placeholder="アレルギーの内容を入力（例：卵、乳製品）"
                      className="w-full border border-orange-300 rounded-xl px-3 py-2 text-base outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  )}

                  {/* 保存/取消 */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); handleEditSave(resident.id); }}
                      className="flex-1 min-h-[44px] rounded-xl bg-blue-600 text-white text-sm font-bold active:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); setEditingId(null); }}
                      className="min-h-[44px] px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium active:bg-gray-200"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : deleteConfirmId === resident.id ? (
                /* 削除確認モード */
                <div className="p-4 flex items-center gap-2 bg-red-50">
                  <p className="flex-1 text-sm text-red-700 font-medium">
                    「{resident.name}」を削除しますか？
                  </p>
                  <button
                    type="button"
                    onPointerDown={(e) => { e.preventDefault(); handleDelete(resident.id); }}
                    className="min-h-[44px] px-4 rounded-xl bg-red-600 text-white text-sm font-bold active:bg-red-700"
                  >
                    削除
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => { e.preventDefault(); setDeleteConfirmId(null); }}
                    className="min-h-[44px] px-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium active:bg-gray-200"
                  >
                    取消
                  </button>
                </div>
              ) : (
                /* 通常表示モード */
                <div className="flex items-center">
                  {/* 並び替えボタン */}
                  <div className="flex flex-col border-r border-gray-100">
                    <button
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); handleReorder(index, "up"); }}
                      disabled={index === 0}
                      className="w-11 h-10 flex items-center justify-center text-gray-400 active:bg-gray-100 disabled:opacity-20"
                      aria-label="上へ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); handleReorder(index, "down"); }}
                      disabled={index === residents.length - 1}
                      className="w-11 h-10 flex items-center justify-center text-gray-400 active:bg-gray-100 disabled:opacity-20"
                      aria-label="下へ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {/* 名前 + アレルギー情報 */}
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <p className="text-base font-medium text-gray-800">{resident.name}</p>
                    {resident.allergy === "有" ? (
                      <p className="text-xs mt-0.5">
                        <span className="inline-block bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded mr-1">
                          アレルギー有
                        </span>
                        {resident.allergy_note && (
                          <span className="text-gray-500">{resident.allergy_note}</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5 text-gray-300">アレルギー無</p>
                    )}
                  </div>

                  {/* 編集・削除ボタン */}
                  <div className="flex items-center gap-1 pr-3">
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setEditingId(resident.id);
                        setEditingName(resident.name);
                        setEditingAllergy(resident.allergy ?? "無");
                        setEditingAllergyNote(resident.allergy_note ?? "");
                        setDeleteConfirmId(null);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-blue-500 active:bg-blue-50"
                      aria-label="編集"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setDeleteConfirmId(resident.id);
                        setEditingId(null);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 active:bg-red-50"
                      aria-label="削除"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* フッター：メッセージ＋追加フォーム */}
      <footer className="shrink-0 bg-white border-t border-gray-200 px-4 pt-3 pb-4 space-y-2">
        <div className="max-w-lg mx-auto space-y-2">
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

          {/* 名前入力 */}
          <div className="flex gap-2">
            <input
              ref={newNameRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleAdd()}
              placeholder="利用者名を入力"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); if (!adding) handleAdd(); }}
              disabled={adding || !newName.trim()}
              className={[
                "min-h-[52px] px-5 rounded-xl font-bold text-base text-white transition-colors",
                adding || !newName.trim()
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 active:bg-blue-700",
              ].join(" ")}
            >
              {adding ? "追加中" : "追加"}
            </button>
          </div>

          {/* アレルギー 有/無 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 w-20 shrink-0">アレルギー</span>
            <div className="flex gap-2 flex-1">
              {(["無", "有"] as ResidentAllergy[]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); setNewAllergy(val); }}
                  className={[
                    "flex-1 min-h-[40px] rounded-xl text-sm font-bold transition-colors",
                    newAllergy === val
                      ? val === "有"
                        ? "bg-orange-500 text-white"
                        : "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* アレルギー内容（有の場合のみ） */}
          {newAllergy === "有" && (
            <input
              type="text"
              value={newAllergyNote}
              onChange={(e) => setNewAllergyNote(e.target.value)}
              placeholder="アレルギーの内容を入力（例：卵、乳製品）"
              className="w-full border border-orange-300 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-400"
            />
          )}
        </div>
      </footer>
    </div>
  );
}
