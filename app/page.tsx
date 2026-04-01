"use client";

import { useState } from "react";
import type { ResidentMeal } from "@/types/meal";
import { DUMMY_RESIDENTS } from "@/types/meal";
import ResidentRow from "@/components/ResidentRow";

export default function MealInputPage() {
  const [residents, setResidents] = useState<ResidentMeal[]>(DUMMY_RESIDENTS);

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const handleChange = (updated: ResidentMeal) => {
    setResidents((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-blue-600 text-white shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-bold leading-tight">給食実績入力</h1>
          <p className="text-sm text-blue-100">{today}</p>
        </div>
      </header>

      {/* 利用者一覧 */}
      <main className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-10">
        {residents.map((resident) => (
          <ResidentRow
            key={resident.id}
            resident={resident}
            onChange={handleChange}
          />
        ))}
      </main>
    </div>
  );
}
