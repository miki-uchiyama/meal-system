import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

function normalizeRecords(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") return [body as Record<string, unknown>];
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const records = normalizeRecords(await req.json());

    if (records.length === 0) {
      return NextResponse.json({ error: "レコードがありません" }, { status: 400 });
    }

    for (const r of records) {
      if (typeof r.meal_date !== "string" || typeof r.resident_name !== "string") {
        return NextResponse.json({ error: "meal_date と resident_name は必須です" }, { status: 400 });
      }
    }

    const db = supabaseServer();
    const pairKeys = new Map<string, { meal_date: string; resident_name: string }>();
    for (const r of records) {
      const meal_date = r.meal_date as string;
      const resident_name = r.resident_name as string;
      pairKeys.set(`${meal_date}\0${resident_name}`, { meal_date, resident_name });
    }

    for (const { meal_date, resident_name } of pairKeys.values()) {
      const { error: delError } = await db
        .from("meal_records")
        .delete()
        .eq("meal_date", meal_date)
        .eq("resident_name", resident_name);

      if (delError) {
        console.error("[api/save-meals] delete error:", delError);
        return NextResponse.json({ error: delError.message }, { status: 500 });
      }
    }

    const { data, error } = await db.from("meal_records").insert(records).select();

    if (error) {
      console.error("[api/save-meals] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[api/save-meals] 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
