export type ResidentAllergy = "有" | "無";

export type Resident = {
  id: number;
  name: string;
  display_order: number;
  allergy: ResidentAllergy;
  allergy_note: string;
};
