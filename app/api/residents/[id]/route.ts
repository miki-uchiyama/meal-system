import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }
    if (body.display_order !== undefined) {
      updates.display_order = body.display_order;
    }

    const { data, error } = await supabaseServer
      .from("residents")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();

    if (error) {
      console.error("[api/residents/[id]] PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[api/residents/[id]] PATCH 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseServer
      .from("residents")
      .delete()
      .eq("id", Number(id));

    if (error) {
      console.error("[api/residents/[id]] DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[api/residents/[id]] DELETE 予期しないエラー:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
