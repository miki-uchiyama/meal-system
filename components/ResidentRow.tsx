"use client";

import type {
  ResidentMeal,
  ProvidedStatus,
  FoodAmount,
} from "@/types/meal";
import ToggleGroup from "./ToggleGroup";

type ResidentRowProps = {
  resident: ResidentMeal;
  onChange: (updated: ResidentMeal) => void;
  /** false のとき利用者名の見出しを出さない（1人入力画面のヘッダーと重複させない） */
  showNameSection?: boolean;
};

const PROVIDED_OPTIONS: ProvidedStatus[] = ["有", "無", "弁当", "休"];
const FOOD_OPTIONS: FoodAmount[] = ["完食", "半分", "少量"];

const PROVIDED_COLOR_MAP: Partial<Record<ProvidedStatus, string>> = {
  有: "bg-green-500 text-white",
  弁当: "bg-blue-500 text-white",
  休: "bg-gray-400 text-white",
  無: "bg-red-400 text-white",
};

export default function ResidentRow({ resident, onChange, showNameSection = true }: ResidentRowProps) {
  const update = <K extends keyof ResidentMeal>(key: K, val: ResidentMeal[K]) => {
    onChange({ ...resident, [key]: val });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      {showNameSection && (
        <div className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
          {resident.name}
        </div>
      )}

      {/* 提供実績 */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">提供実績（有/無/弁当/休）</span>
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
        <span className="text-xs font-semibold text-gray-500 tracking-wide">残食記録・主食（完食/半分/少量）</span>
        <ToggleGroup<FoodAmount>
          options={FOOD_OPTIONS}
          value={resident.staple}
          onChange={(v) => update("staple", v)}
        />
      </div>

      {/* おかず量 */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">残食記録・おかず（完食/半分/少量）</span>
        <ToggleGroup<FoodAmount>
          options={FOOD_OPTIONS}
          value={resident.side}
          onChange={(v) => update("side", v)}
        />
      </div>

      {/* アレルギー（読み取り専用） */}
      <div className="space-y-1 pt-1 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">アレルギー（表示のみ）</span>
        {resident.allergy === "有" ? (
          <div className="text-lg font-bold text-gray-800">
            <span className="inline-block bg-orange-100 text-orange-700 px-2 py-0.5 rounded mr-2">
              有
            </span>
            {resident.allergy_note && (
              <span>{resident.allergy_note}</span>
            )}
          </div>
        ) : (
          <div className="text-lg font-bold text-gray-400">無</div>
        )}
      </div>
    </div>
  );
}
