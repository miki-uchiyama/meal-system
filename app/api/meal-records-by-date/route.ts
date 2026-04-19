import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const date = new URL(req.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date パラメータ（YYYY-MM-DD）が必要です" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseServer()
      .from("meal_records")
      .select("resident_name, provided, staple_amount, side_amount, allergy, id")
      .eq("meal_date", date)
      .order("id", { ascending: true });

    if (error) {
      console.error("[api/meal-records-by-date] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const byName: Record<
      string,
      {
        resident_name: string;
        provided: string;
        staple_amount: string;
        side_amount: string;
        allergy: string;
      }
    > = {};

    for (const row of data ?? []) {
      byName[row.resident_name] = {
        resident_name: row.resident_name,
        provided: row.provided,
        staple_amount: row.staple_amount ?? "",
        side_amount: row.side_amount ?? "",
        allergy: row.allergy ?? "無",
      };
    }

    return NextResponse.json({ data: Object.values(byName) }, { status: 200 });
  } catch (err) {
    console.error("[api/meal-records-by-date] 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
