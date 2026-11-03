import { z } from "zod";
import { frameSchema, idSchema, imageSchema, MAX_FRAMES, sanitizeSourceUrl, sourceUrlSchema } from "./contracts.ts";
import { requireCondition } from "./errors.ts";

const timestampSchema = z.number().int().nonnegative().max(8_640_000_000_000_000 - 600);
const revisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER - 1);
const originSchema = z.string().max(4096).refine((value) => {
  try { return new URL(sanitizeSourceUrl(value)).origin === value; } catch { return false; }
});
const viewportSchema = z.strictObject({
  width: z.number().int().positive().max(8192), height: z.number().int().positive().max(8192),
});
const contextSchema = z.strictObject({
  tabId: z.number().int().nonnegative(),
  windowId: z.number().int().nonnegative(),
  frameId: z.literal(0),
  documentId: z.string().min(1).max(200),
  documentVersion: z.number().int().nonnegative(),
  url: z.string().max(4096),
  active: z.boolean(),
  viewport: viewportSchema,
});
const pendingSchema = z.strictObject({
  captureId: idSchema,
  documentId: z.string().min(1).max(200),
  documentVersion: z.number().int().nonnegative(),
  sourceUrl: sourceUrlSchema,
  requestedAt: timestampSchema,
  viewport: viewportSchema,
});

export const sessionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: idSchema, flowId: idSchema, workspaceId: idSchema,
  tabId: z.number().int().nonnegative(), windowId: z.number().int().nonnegative(),
  origin: originSchema,
  status: z.enum(["recording", "paused", "stopped"]),
  revision: revisionSchema,
  nextCaptureAt: timestampSchema,
  pending: pendingSchema.nullable(),
  frames: z.array(frameSchema).max(MAX_FRAMES),
}).superRefine((session, context) => {
  if (new Set(session.frames.map((frame) => frame.id)).size !== session.frames.length) {
    context.addIssue({ code: "custom", message: "Duplicate captured frame" });
  }
  if (session.status !== "recording" && session.pending !== null) {
    context.addIssue({ code: "custom", message: "Inactive sessions cannot have a pending capture" });
  }
});
export type RecordingSession = z.infer<typeof sessionSchema>;
type CaptureContext = z.infer<typeof contextSchema>;

function checkContext(session: RecordingSession, context: CaptureContext) {
  requireCondition(context.active, "RECORDED_TAB_NOT_ACTIVE");
  requireCondition(context.tabId === session.tabId && context.windowId === session.windowId, "WRONG_CAPTURE_TAB");
  requireCondition(new URL(sanitizeSourceUrl(context.url)).origin === session.origin, "ORIGIN_CHANGED");
}

function checkRevision(session: RecordingSession, expectedRevision: number) {
  revisionSchema.parse(expectedRevision);
  requireCondition(session.revision === expectedRevision, "REVISION_CONFLICT");
}

/** Context must be constructed from trusted Chrome sender/tab data, not the page payload. */
export function startRecording(idsInput: unknown, contextInput: unknown, now: number): RecordingSession {
  const ids = z.strictObject({ id: idSchema, flowId: idSchema, workspaceId: idSchema }).parse(idsInput);
  const context = contextSchema.parse(contextInput);
  timestampSchema.parse(now);
  requireCondition(context.active, "RECORDED_TAB_NOT_ACTIVE");
  return sessionSchema.parse({
    schemaVersion: 1, ...ids, tabId: context.tabId, windowId: context.windowId,
    origin: new URL(sanitizeSourceUrl(context.url)).origin,
    status: "recording", revision: 0, nextCaptureAt: now, pending: null, frames: [],
  });
}

/** Persist reservation atomically before calling captureVisibleTab. Never queue delayed
 * screenshots of old clicks: they would capture a different screen.
 */
export function reserveCapture(
  sessionInput: unknown, captureIdInput: unknown, contextInput: unknown,
  expectedRevision: number, now: number,
): RecordingSession {
  const session = sessionSchema.parse(sessionInput);
  const captureId = idSchema.parse(captureIdInput);
  const context = contextSchema.parse(contextInput);
  timestampSchema.parse(now);
  checkRevision(session, expectedRevision);
  requireCondition(session.status === "recording", "NOT_RECORDING");
  checkContext(session, context);
  requireCondition(session.pending === null, "CAPTURE_BUSY");
  requireCondition(now >= session.nextCaptureAt, "CAPTURE_RATE_LIMIT");
  requireCondition(session.frames.length < MAX_FRAMES, "FRAME_LIMIT");
  requireCondition(!session.frames.some((frame) => frame.id === captureId), "CAPTURE_ALREADY_COMMITTED");
  return sessionSchema.parse({
    ...session, revision: session.revision + 1, nextCaptureAt: now + 600,
    pending: { captureId, documentId: context.documentId, documentVersion: context.documentVersion,
      sourceUrl: sanitizeSourceUrl(context.url), requestedAt: now, viewport: context.viewport },
  });
}

/** A frame is appended once, using its reserved identity. A retry with the same image
 * metadata is idempotent. The image adapter must validate bytes before this call.
 */
export function commitCapture(
  sessionInput: unknown, captureIdInput: unknown, imageInput: unknown,
  contextInput: unknown, expectedRevision: number, now: number,
): RecordingSession {
  const session = sessionSchema.parse(sessionInput);
  const captureId = idSchema.parse(captureIdInput);
  const image = imageSchema.parse(imageInput);
  timestampSchema.parse(now);
  const existing = session.frames.find((frame) => frame.id === captureId);
  if (existing) {
    requireCondition(JSON.stringify(existing.image) === JSON.stringify(image), "IDEMPOTENCY_CONFLICT");
    return session;
  }
  checkRevision(session, expectedRevision);
  requireCondition(session.status === "recording", "NOT_RECORDING");
  const pending = session.pending;
  requireCondition(pending !== null && pending.captureId === captureId, "CAPTURE_NOT_RESERVED");
  const context = contextSchema.parse(contextInput);
  checkContext(session, context);
  requireCondition(context.documentId === pending.documentId
    && context.documentVersion === pending.documentVersion
    && sanitizeSourceUrl(context.url) === pending.sourceUrl
    && context.viewport.width === pending.viewport.width
    && context.viewport.height === pending.viewport.height, "DOCUMENT_CHANGED_DURING_CAPTURE");
  requireCondition(now >= pending.requestedAt, "INVALID_CAPTURE_TIME");
  return sessionSchema.parse({
    ...session, revision: session.revision + 1, pending: null,
    frames: [...session.frames, { id: captureId, image, sourceUrl: pending.sourceUrl,
      capturedAt: new Date(now).toISOString() }],
  });
}

/** Pause/stop and interruption recovery retain completed frames and invalidate pending work. */
export function setRecordingStatus(
  sessionInput: unknown, status: "recording" | "paused" | "stopped", expectedRevision: number,
): RecordingSession {
  const session = sessionSchema.parse(sessionInput);
  checkRevision(session, expectedRevision);
  requireCondition(session.status !== "stopped" || status === "stopped", "SESSION_ALREADY_STOPPED");
  return sessionSchema.parse({ ...session, status, pending: null, revision: session.revision + 1 });
}

/** Abandoned pending screenshots are not recreated from a later page state. */
export function recoverRecording(sessionInput: unknown): RecordingSession {
  const session = sessionSchema.parse(sessionInput);
  if (session.status !== "recording") return session;
  return setRecordingStatus(session, "paused", session.revision);
}

export interface SessionStore {
  read(id: string): Promise<unknown>;
  /** Must atomically compare and write in one IndexedDB/database transaction. */
  compareAndSwap(id: string, expectedRevision: number, next: RecordingSession): Promise<boolean>;
}

/** No screenshot/network side effects belong inside the reducer. */
export async function updateSession(
  store: SessionStore, id: string, expectedRevision: number,
  reduce: (session: RecordingSession) => RecordingSession,
): Promise<RecordingSession> {
  idSchema.parse(id);
  const current = sessionSchema.parse(await store.read(id));
  requireCondition(current.id === id, "SESSION_ID_MISMATCH");
  checkRevision(current, expectedRevision);
  const next = sessionSchema.parse(reduce(current));
  requireCondition(next.id === current.id && next.flowId === current.flowId
    && next.workspaceId === current.workspaceId && next.tabId === current.tabId
    && next.windowId === current.windowId && next.origin === current.origin, "SESSION_IDENTITY_CHANGED");
  requireCondition(next.revision === current.revision + 1, "INVALID_NEXT_REVISION");
  requireCondition(await store.compareAndSwap(id, expectedRevision, next), "REVISION_CONFLICT");
  return next;
}
