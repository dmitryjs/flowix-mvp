import { randomUUID } from 'node:crypto';

export const id = () => randomUUID();
export const now = Date.parse('2026-11-03T12:00:00Z');
export const image = (changes = {}) => ({
  id: id(), sha256: 'a'.repeat(64), width: 1440, height: 900, byteLength: 250_000, mimeType: 'image/png', ...changes,
});
export const context = (changes = {}) => ({
  tabId: 17, windowId: 2, frameId: 0, documentId: 'document-A', documentVersion: 1,
  url: 'https://example.com/settings?token=secret#private', active: true,
  viewport: { width: 1440, height: 900 }, ...changes,
});
export const identifiers = () => ({ id: id(), flowId: id(), workspaceId: id() });
export const frame = () => ({ id: id(), image: image(), sourceUrl: 'https://example.com/settings',
  capturedAt: new Date(now).toISOString() });
export function flow() {
  const frames = [frame(), frame(), frame()];
  return { schemaVersion: 1, id: id(), workspaceId: id(), title: 'Invite a colleague', frames,
    transitions: frames.slice(0, -1).map((from, index) => ({
      fromFrameId: from.id, toFrameId: frames[index + 1].id,
      hotspot: { x: 0.25, y: 0.25, width: 0.25, height: 0.25 },
    })) };
}
