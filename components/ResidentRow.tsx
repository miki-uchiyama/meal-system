"use client";

import type {
  ResidentMeal,
  ProvidedStatus,
  FoodAmount,
} from "@/types/meal";

type ResidentRowProps = {
  resident: ResidentMeal;
  onChange: (updated: ResidentMeal) => void;
  /** false のとき利用者名の見出しを出さない（1人入力画面のヘッダーと重複させない） */
  showNameSection?: boolean;
};

const FOOD_REST_OPTIONS: FoodAmount[] = ["少量", "半分", "多量", "全量"];

/** ToggleGroup size="large" と同寸法 */
const PROVIDED_LARGE_BUTTON =
  "min-h-[68px] min-w-[80px] px-8 text-2xl font-bold rounded-xl border-2 transition-colors duration-150";

const PROVIDED_COLOR_MAP: Partial<Record<ProvidedStatus, string>> = {
  有: "bg-green-500 text-white",
  弁当: "bg-blue-500 text-white",
  休: "bg-gray-400 text-white",
  無: "bg-red-400 text-white",
};

function ProvidedStatusTwoRow({
  value,
  onChange,
}: {
  value: ProvidedStatus;
  onChange: (v: ProvidedStatus) => void;
}) {
  const row = (options: ProvidedStatus[]) => (
    <div className="flex justify-center gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        const selectedColor = PROVIDED_COLOR_MAP[opt] ?? "bg-blue-500 text-white";
        return (
          <button
            key={opt}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onChange(opt);
            }}
            className={[
              PROVIDED_LARGE_BUTTON,
              selected ? `${selectedColor} border-transparent` : "border-gray-200 bg-white text-gray-600",
            ].join(" ")}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-2">
      {row(["有", "無"])}
      {row(["弁当", "休"])}
    </div>
  );
}

function FoodAmountTwoRow({
  value,
  onChange,
}: {
  value: FoodAmount;
  onChange: (v: FoodAmount) => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onChange("完食");
        }}
        className={[
          "w-full min-h-[80px] rounded-2xl border-2 text-2xl font-bold transition-colors duration-150",
          value === "完食"
            ? "border-transparent bg-blue-500 text-white"
            : "border-gray-200 bg-white text-gray-600",
        ].join(" ")}
      >
        完食
      </button>
      <div className="grid grid-cols-4 gap-2">
        {FOOD_REST_OPTIONS.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onChange(opt);
              }}
              className={[
                "min-h-[56px] rounded-xl border-2 text-sm font-semibold leading-tight transition-colors duration-150 sm:text-base",
                selected
                  ? "border-transparent bg-blue-500 text-white"
                  : "border-gray-200 bg-white text-gray-600",
              ].join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
        <ProvidedStatusTwoRow value={resident.provided} onChange={(v) => update("provided", v)} />
      </div>

      {/* 主食量 */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">残食記録・主食（完食/少量/半分/多量/全量）</span>
        <FoodAmountTwoRow value={resident.staple} onChange={(v) => update("staple", v)} />
      </div>

      {/* おかず量 */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">残食記録・おかず（完食/少量/半分/多量/全量）</span>
        <FoodAmountTwoRow value={resident.side} onChange={(v) => update("side", v)} />
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
