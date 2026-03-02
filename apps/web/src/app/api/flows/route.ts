import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const createFlowSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  ownerId: z.string().min(1),
});

export async function POST(request: Request) {
  const ownerHeader = request.headers.get("x-owner-id");
  if (!ownerHeader) {
    return NextResponse.json(
      { error: "x-owner-id header is required" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createFlowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // TODO: Replace temporary x-owner-id check with proper auth/session validation.
  if (ownerHeader !== parsed.data.ownerId) {
    return NextResponse.json(
      { error: "x-owner-id does not match ownerId" },
      { status: 403 }
    );
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("flows")
    .insert({
      project_id: parsed.data.projectId,
      name: parsed.data.name,
      owner_id: parsed.data.ownerId,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
