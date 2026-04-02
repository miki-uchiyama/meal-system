import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const MEAL_FEE = 250;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json({ error: "year と month は必須です" }, { status: 400 });
  }

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    return NextResponse.json({ error: "year・month の値が不正です" }, { status: 400 });
  }

  const paddedMonth = String(m).padStart(2, "0");
  const startDate = `${y}-${paddedMonth}-01`;
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  const endDate = `${nextY}-${String(nextM).padStart(2, "0")}-01`;

  try {
    const [{ data: records, error: recordsError }, { data: residents, error: residentsError }] =
      await Promise.all([
        supabaseServer
          .from("meal_records")
          .select("resident_name")
          .gte("meal_date", startDate)
          .lt("meal_date", endDate)
          .eq("provided", "有"),
        supabaseServer
          .from("residents")
          .select("name, display_order")
          .order("display_order", { ascending: true }),
      ]);

    if (recordsError) {
      console.error("[api/monthly-summary] records error:", recordsError);
      return NextResponse.json({ error: recordsError.message }, { status: 500 });
    }
    if (residentsError) {
      console.error("[api/monthly-summary] residents error:", residentsError);
      return NextResponse.json({ error: residentsError.message }, { status: 500 });
    }

    const mealCountMap: Record<string, number> = {};
    for (const r of records ?? []) {
      mealCountMap[r.resident_name] = (mealCountMap[r.resident_name] ?? 0) + 1;
    }

    const summary = (residents ?? []).map((r) => {
      const mealCount = mealCountMap[r.name] ?? 0;
      return { name: r.name, mealCount, fee: mealCount * MEAL_FEE };
    });

    const totalMeals = summary.reduce((s, r) => s + r.mealCount, 0);
    const totalFee = totalMeals * MEAL_FEE;

    return NextResponse.json({ data: summary, totalMeals, totalFee }, { status: 200 });
  } catch (err) {
    console.error("[api/monthly-summary] 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
