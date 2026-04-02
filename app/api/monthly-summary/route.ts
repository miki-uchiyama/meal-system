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
  const daysInMonth = new Date(y, m, 0).getDate();

  try {
    const db = supabaseServer();
    const [{ data: records, error: recordsError }, { data: residents, error: residentsError }] =
      await Promise.all([
        db
          .from("meal_records")
          .select("resident_name, provided, meal_date")
          .gte("meal_date", startDate)
          .lt("meal_date", endDate),
        db
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

    // resident_name -> day -> provided status（同じ日に複数保存があれば最後のものを使用）
    const dailyMap: Record<string, Record<number, string>> = {};
    for (const r of records ?? []) {
      const day = parseInt(r.meal_date.split("-")[2], 10);
      if (!dailyMap[r.resident_name]) dailyMap[r.resident_name] = {};
      dailyMap[r.resident_name][day] = r.provided;
    }

    const data = (residents ?? []).map((r) => {
      const days = dailyMap[r.name] ?? {};
      const mealCount = Object.values(days).filter((v) => v === "有").length;
      return {
        name: r.name,
        mealCount,
        fee: mealCount * MEAL_FEE,
        days,
      };
    });

    const totalMeals = data.reduce((s, r) => s + r.mealCount, 0);
    const totalFee = totalMeals * MEAL_FEE;

    return NextResponse.json(
      { data, totalMeals, totalFee, daysInMonth, year: y, month: m },
      { status: 200 }
    );
  } catch (err) {
    console.error("[api/monthly-summary] 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
