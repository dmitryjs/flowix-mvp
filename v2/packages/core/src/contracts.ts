import { z } from "zod";

export const idSchema = z.uuid();
export const MAX_FRAMES = 200;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Remove URL credentials, query and fragment before persistence or logging.
 * Paths can still contain sensitive data; review/redaction remains necessary.
 */
export function sanitizeSourceUrl(input: string): string {
  if (input.length > 4096) throw new Error("URL_TOO_LONG");
  const url = new URL(input);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("UNSUPPORTED_URL_SCHEME");
  }
  return url.origin + url.pathname;
}

export const sourceUrlSchema = z.string().max(4096).refine((value) => {
  try { return sanitizeSourceUrl(value) === value; } catch { return false; }
}, "URL must be canonical http(s), without credentials, query or fragment");

export const rectSchema = z.strictObject({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().gt(0).max(1),
  height: z.number().gt(0).max(1),
}).refine((r) => r.x + r.width <= 1 + 1e-9 && r.y + r.height <= 1 + 1e-9,
  "Hotspot must fit within the screenshot");

export const imageSchema = z.strictObject({
  id: idSchema,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  width: z.number().int().positive().max(8192),
  height: z.number().int().positive().max(8192),
  byteLength: z.number().int().positive().max(MAX_IMAGE_BYTES),
  mimeType: z.enum(["image/png", "image/jpeg"]),
}).refine((image) => image.width * image.height <= 24_000_000,
  "Image exceeds pixel budget");

export const frameSchema = z.strictObject({
  id: idSchema,
  image: imageSchema,
  sourceUrl: sourceUrlSchema,
  capturedAt: z.iso.datetime(),
});

export const transitionSchema = z.strictObject({
  fromFrameId: idSchema,
  toFrameId: idSchema,
  hotspot: rectSchema,
});

export const flowSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: idSchema,
  workspaceId: idSchema,
  title: z.string().trim().min(1).max(160),
  frames: z.array(frameSchema).min(1).max(MAX_FRAMES),
  transitions: z.array(transitionSchema).max(MAX_FRAMES - 1),
}).superRefine((flow, context) => {
  const positions = new Map(flow.frames.map((frame, index) => [frame.id, index]));
  if (positions.size !== flow.frames.length) {
    context.addIssue({ code: "custom", message: "Duplicate frame ID" });
  }
  const outgoing = new Set<string>();
  for (const transition of flow.transitions) {
    const from = positions.get(transition.fromFrameId);
    const to = positions.get(transition.toFrameId);
    if (from === undefined || to === undefined || to !== from + 1) {
      context.addIssue({ code: "custom", message: "Only adjacent forward transitions are supported" });
    }
    if (outgoing.has(transition.fromFrameId)) {
      context.addIssue({ code: "custom", message: "A frame may have only one outgoing transition" });
    }
    outgoing.add(transition.fromFrameId);
  }
});

export type Rect = z.infer<typeof rectSchema>;
export type Frame = z.infer<typeof frameSchema>;
export type Flow = z.infer<typeof flowSchema>;

/** Metadata validation does not decode an image or prove asset ownership. */
export function parseFlow(input: unknown): Flow {
  return flowSchema.parse(input);
}
