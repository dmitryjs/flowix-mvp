import { z } from "zod";
import { parseFlow, rectSchema } from "./contracts.ts";
import type { Frame, Rect } from "./contracts.ts";
import { requireCondition } from "./errors.ts";

const pixelRectSchema = z.strictObject({
  x: z.number(), y: z.number(),
  width: z.number().positive(), height: z.number().positive(),
});
const viewportSchema = z.strictObject({
  width: z.number().positive(), height: z.number().positive(),
});
const pointSchema = z.strictObject({
  x: z.number().min(0).max(1), y: z.number().min(0).max(1),
});

/** Coordinates are relative to the captured content viewport, not browser chrome. */
export function normalizeHotspot(rectInput: unknown, viewportInput: unknown): Rect {
  const rect = pixelRectSchema.parse(rectInput);
  const viewport = viewportSchema.parse(viewportInput);
  const left = Math.max(0, rect.x);
  const top = Math.max(0, rect.y);
  const right = Math.min(viewport.width, rect.x + rect.width);
  const bottom = Math.min(viewport.height, rect.y + rect.height);
  requireCondition(right > left && bottom > top, "HOTSPOT_OUTSIDE_VIEWPORT");
  return rectSchema.parse({
    x: left / viewport.width, y: top / viewport.height,
    width: (right - left) / viewport.width, height: (bottom - top) / viewport.height,
  });
}

/** The UI must measure the rendered image bounds, excluding object-fit letterboxing. */
export function followHotspot(flowInput: unknown, fromFrameId: string, pointInput: unknown): Frame | null {
  const flow = parseFlow(flowInput);
  const point = pointSchema.parse(pointInput);
  requireCondition(flow.frames.some((frame) => frame.id === fromFrameId), "FRAME_NOT_FOUND");
  const link = flow.transitions.find((transition) => transition.fromFrameId === fromFrameId);
  if (!link) return null;
  const r = link.hotspot;
  if (point.x < r.x || point.x > r.x + r.width || point.y < r.y || point.y > r.y + r.height) return null;
  return flow.frames.find((frame) => frame.id === link.toFrameId) ?? null;
}

/** Drafts may have missing links. Every adjacent pair must be linked before publishing. */
export function requirePlayableFlow(input: unknown) {
  const flow = parseFlow(input);
  requireCondition(flow.transitions.length === flow.frames.length - 1, "FLOW_HAS_MISSING_TRANSITIONS");
  return flow;
}
