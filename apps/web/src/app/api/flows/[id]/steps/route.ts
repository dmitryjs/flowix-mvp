import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthorizedUserId } from "@/lib/auth-server";

const MAX_STEPS_PER_FLOW = 30;
const MAX_STEPS_PER_MONTH = 200;

const uploadStepSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.type === "image/png" || file.type === "image/jpeg",
      "file must be png/jpg"
    ),
  url: z.string().url(),
  stepIndex: z.coerce.number().int().nonnegative(),
  clickX: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().optional()
  ),
  clickY: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().optional()
  ),
  viewportW: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().optional()
  ),
  viewportH: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().optional()
  ),
  selector: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().optional()
  ),
  elementRect: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().optional()
  ),
});

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

  const { data: steps, error: stepsError } = await supabase
    .from("flow_steps")
    .select("*")
    .eq("flow_id", flowId)
    .order("step_index", { ascending: true });

  if (stepsError) {
    return NextResponse.json({ error: stepsError.message }, { status: 500 });
  }

  return NextResponse.json(steps ?? [], { status: 200 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ownerId = await getAuthorizedUserId(request);
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: flowId } = await context.params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart/form-data" },
      { status: 400 }
    );
  }

  const parsed = uploadStepSchema.safeParse({
    file: formData.get("file"),
    url: formData.get("url"),
    stepIndex: formData.get("stepIndex"),
    clickX: formData.get("clickX"),
    clickY: formData.get("clickY"),
    viewportW: formData.get("viewportW"),
    viewportH: formData.get("viewportH"),
    selector: formData.get("selector"),
    elementRect: formData.get("elementRect"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!storageBucket) {
    return NextResponse.json(
      { error: "SUPABASE_STORAGE_BUCKET is not configured" },
      { status: 500 }
    );
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

  const { count: flowStepCount, error: flowCountError } = await supabase
    .from("flow_steps")
    .select("*", { count: "exact", head: true })
    .eq("flow_id", flowId);

  if (flowCountError) {
    return NextResponse.json({ error: flowCountError.message }, { status: 500 });
  }

  if ((flowStepCount ?? 0) >= MAX_STEPS_PER_FLOW) {
    return NextResponse.json(
      {
        error: "Flow step limit reached",
        code: "FLOW_STEP_LIMIT",
        limit: MAX_STEPS_PER_FLOW,
      },
      { status: 429 }
    );
  }

  const { data: userFlows, error: userFlowsError } = await supabase
    .from("flows")
    .select("id")
    .eq("owner_id", ownerId);

  if (userFlowsError) {
    return NextResponse.json({ error: userFlowsError.message }, { status: 500 });
  }

  const userFlowIds = (userFlows ?? []).map((f: { id: string }) => f.id);

  if (userFlowIds.length > 0) {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    ).toISOString();

    const { count: monthlyStepCount, error: monthlyCountError } = await supabase
      .from("flow_steps")
      .select("*", { count: "exact", head: true })
      .in("flow_id", userFlowIds)
      .gte("created_at", monthStart);

    if (!monthlyCountError && (monthlyStepCount ?? 0) >= MAX_STEPS_PER_MONTH) {
      return NextResponse.json(
        {
          error: "Monthly step limit reached",
          code: "MONTHLY_STEP_LIMIT",
          limit: MAX_STEPS_PER_MONTH,
        },
        { status: 429 }
      );
    }
  }

  const ext = parsed.data.file.type === "image/jpeg" ? ".jpg" : ".png";
  const filePath = `user/${ownerId}/flows/${flowId}/${crypto.randomUUID()}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(filePath, parsed.data.file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error: insertError } = await supabase
    .from("flow_steps")
    .insert({
      flow_id: flowId,
      step_index: parsed.data.stepIndex,
      url: parsed.data.url,
      screenshot_path: filePath,
      click_x: parsed.data.clickX ?? null,
      click_y: parsed.data.clickY ?? null,
      viewport_w: parsed.data.viewportW ?? null,
      viewport_h: parsed.data.viewportH ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ stepId: data.id }, { status: 201 });
}
