"use client";

import type {
  ResidentMeal,
  ProvidedStatus,
  FoodAmount,
  AllergyStatus,
} from "@/types/meal";
import ToggleGroup from "./ToggleGroup";

type ResidentRowProps = {
  resident: ResidentMeal;
  onChange: (updated: ResidentMeal) => void;
};

const PROVIDED_OPTIONS: ProvidedStatus[] = ["○", "×"];
const FOOD_OPTIONS: FoodAmount[] = ["完食", "半分", "少量", "無"];
const ALLERGY_OPTIONS: AllergyStatus[] = ["無", "有"];

const PROVIDED_COLOR_MAP: Partial<Record<ProvidedStatus, string>> = {
  "○": "bg-green-500 text-white",
  "×": "bg-red-400 text-white",
};

const ALLERGY_COLOR_MAP: Partial<Record<AllergyStatus, string>> = {
  有: "bg-orange-500 text-white",
  無: "bg-blue-500 text-white",
};

export default function ResidentRow({ resident, onChange }: ResidentRowProps) {
  const update = <K extends keyof ResidentMeal>(key: K, value: ResidentMeal[K]) => {
    onChange({ ...resident, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      {/* 利用者名 */}
      <div className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
        {resident.name}
      </div>

      {/* 提供実績（最上部・大きめボタン） */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">提供実績</span>
        <ToggleGroup<ProvidedStatus>
          options={PROVIDED_OPTIONS}
          value={resident.provided}
          onChange={(v) => update("provided", v)}
          colorMap={PROVIDED_COLOR_MAP}
          size="large"
        />
      </div>

      {/* 主食量 */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">主食量</span>
        <ToggleGroup<FoodAmount>
          options={FOOD_OPTIONS}
          value={resident.staple}
          onChange={(v) => update("staple", v)}
        />
      </div>

      {/* おかず量 */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">おかず量</span>
        <ToggleGroup<FoodAmount>
          options={FOOD_OPTIONS}
          value={resident.side}
          onChange={(v) => update("side", v)}
        />
      </div>

      {/* アレルギー */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">アレルギー</span>
        <ToggleGroup<AllergyStatus>
          options={ALLERGY_OPTIONS}
          value={resident.allergy}
          onChange={(v) => update("allergy", v)}
          colorMap={ALLERGY_COLOR_MAP}
        />
      </div>
    </div>
  );
}
