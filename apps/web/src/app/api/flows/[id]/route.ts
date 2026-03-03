import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthorizedUserId } from "@/lib/auth-server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ownerId = await getAuthorizedUserId(request);
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: flowId } = await context.params;
  const supabase = createSupabaseServerClient();

  const { data: flow, error: flowError } = await supabase
    .from("flows")
    .select("id, project_id, name, created_at")
    .eq("id", flowId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (flowError) {
    return NextResponse.json({ error: flowError.message }, { status: 500 });
  }

  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  return NextResponse.json(flow, { status: 200 });
}
