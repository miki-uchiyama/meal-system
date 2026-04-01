"use client";

type ToggleGroupProps<T extends string> = {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  colorMap?: Partial<Record<T, string>>;
  size?: "default" | "large";
};

export default function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  colorMap,
  size = "default",
}: ToggleGroupProps<T>) {
  const sizeClasses =
    size === "large"
      ? "min-h-[56px] min-w-[56px] px-6 text-base font-bold"
      : "min-h-[48px] min-w-[48px] px-4 text-sm font-medium";

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option;
        const selectedColor = colorMap?.[option] ?? "bg-blue-500 text-white";
        return (
          <button
            key={option}
            type="button"
            /*
             * onPointerDown で即座に反応させる。
             * iOS Safari の onClick 遅延・消失バグを回避する。
             */
            onPointerDown={(e) => {
              e.preventDefault();
              onChange(option);
            }}
            className={[
              sizeClasses,
              "rounded-xl border-2 transition-colors duration-150",
              isSelected
                ? `${selectedColor} border-transparent`
                : "bg-white text-gray-600 border-gray-200",
            ].join(" ")}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
