import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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
  ownerId: z.string().min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ownerHeader = request.headers.get("x-owner-id");
  if (!ownerHeader) {
    return NextResponse.json(
      { error: "x-owner-id header is required" },
      { status: 401 }
    );
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
    ownerId: formData.get("ownerId"),
  });

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

  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!storageBucket) {
    return NextResponse.json(
      { error: "SUPABASE_STORAGE_BUCKET is not configured" },
      { status: 500 }
    );
  }

  const filePath = `user/${parsed.data.ownerId}/flows/${flowId}/${crypto.randomUUID()}.png`;
  const supabase = createSupabaseServerClient();

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
