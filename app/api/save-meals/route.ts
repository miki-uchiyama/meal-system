import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log("[api] SUPABASE_URL:", supabaseUrl ?? "未設定");
  console.log("[api] ANON_KEY先頭:", supabaseKey?.substring(0, 20) ?? "未設定");

  try {
    const records = await req.json();

    const { data, error } = await supabaseServer
      .from("meal_records")
      .insert(records)
      .select();

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
