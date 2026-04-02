export type ResidentAllergy = "有" | "無";
export type ResidentDefaultProvided = "有" | "無" | "弁当" | "休";

export type Resident = {
  id: number;
  name: string;
  display_order: number;
  allergy: ResidentAllergy;
  allergy_note: string;
  default_provided: ResidentDefaultProvided;
};
