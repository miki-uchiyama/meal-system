import { createClient } from "@supabase/supabase-js";

// サーバーサイド専用クライアント（ブラウザには公開されない）
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
