import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("residents")
      .select("id, name, display_order, allergy, allergy_note, default_provided")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[api/residents] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[api/residents] 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, display_order, allergy, allergy_note, default_provided } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("residents")
      .insert({
        name: name.trim(),
        display_order: display_order ?? 0,
        allergy: allergy ?? "無",
        allergy_note: allergy_note ?? "",
        default_provided: default_provided ?? "無",
      })
      .select()
      .single();

    if (error) {
      console.error("[api/residents] POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[api/residents] POST 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
