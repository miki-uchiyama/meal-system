export type ProvidedStatus = "有" | "弁当" | "休" | "無";
export type FoodAmount = "完食" | "半分" | "少量" | "無";
export type AllergyStatus = "無" | "有";

export type ResidentMeal = {
  id: number;
  name: string;
  provided: ProvidedStatus;
  staple: FoodAmount;
  side: FoodAmount;
  allergy: AllergyStatus;
  allergy_note: string;
};

export const DUMMY_RESIDENTS: ResidentMeal[] = [
  { id: 1, name: "山田 花子", provided: "無", staple: "無", side: "無", allergy: "無", allergy_note: "" },
  { id: 2, name: "鈴木 太郎", provided: "無", staple: "無", side: "無", allergy: "無", allergy_note: "" },
  { id: 3, name: "田中 さくら", provided: "無", staple: "無", side: "無", allergy: "無", allergy_note: "" },
  { id: 4, name: "伊藤 健一", provided: "無", staple: "無", side: "無", allergy: "無", allergy_note: "" },
  { id: 5, name: "渡辺 美咲", provided: "無", staple: "無", side: "無", allergy: "無", allergy_note: "" },
  { id: 6, name: "中村 浩二", provided: "無", staple: "無", side: "無", allergy: "無", allergy_note: "" },
  { id: 7, name: "小林 和子", provided: "無", staple: "無", side: "無", allergy: "無", allergy_note: "" },
  { id: 8, name: "加藤 正男", provided: "無", staple: "無", side: "無", allergy: "無", allergy_note: "" },
];
