import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthorizedUserId } from "@/lib/auth-server";

const patchStepSchema = z.object({
  url: z.string().url().optional(),
  name: z.string().min(1).max(200).optional(),
}).refine((data) => data.url !== undefined || data.name !== undefined, {
  message: "At least one field (url or name) must be provided",
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; stepId: string }> }
) {
  const ownerId = await getAuthorizedUserId(request);
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: flowId, stepId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data: flow, error: flowError } = await supabase
    .from("flows")
    .select("id")
    .eq("id", flowId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (flowError) {
    return NextResponse.json({ error: flowError.message }, { status: 500 });
  }
  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  const updates: Record<string, string> = {};
  if (parsed.data.url !== undefined) updates.url = parsed.data.url;
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;

  const { data, error: updateError } = await supabase
    .from("flow_steps")
    .update(updates)
    .eq("id", stepId)
    .eq("flow_id", flowId)
    .select("id, url, name")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
