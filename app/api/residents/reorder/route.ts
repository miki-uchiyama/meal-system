import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// 並び順を一括更新する。ids は新しい順番通りの id 配列。
export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: number[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids は必須です" }, { status: 400 });
    }

    const updates = ids.map((id, index) =>
      supabaseServer
        .from("residents")
        .update({ display_order: index })
        .eq("id", id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      console.error("[api/residents/reorder] error:", failed.error);
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[api/residents/reorder] 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
