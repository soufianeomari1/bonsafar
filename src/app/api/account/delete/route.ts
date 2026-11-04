import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Deletes the signed-in traveller's account. Profile, trips and price alerts
 * go with it (on delete cascade). Only the session's own user can be deleted.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: "not_signed_in" }, { status: 401 });

  const { error } = await adminClient().auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ ok: false, code: "delete_failed" }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
