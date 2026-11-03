import test from 'node:test';
import assert from 'node:assert/strict';
import { flowSchema, imageSchema, parseFlow, sanitizeSourceUrl } from '../packages/core/src/contracts.ts';
import { followHotspot, normalizeHotspot, requirePlayableFlow } from '../packages/core/src/replay.ts';
import { flow, id, image } from './fixtures.mjs';

test('replays an actual three-frame path and stops on its terminal frame', () => {
  const data = flow();
  const second = followHotspot(data, data.frames[0].id, { x: 0.3, y: 0.3 });
  assert.equal(second.id, data.frames[1].id);
  const third = followHotspot(data, second.id, { x: 0.3, y: 0.3 });
  assert.equal(third.id, data.frames[2].id);
  assert.equal(followHotspot(data, third.id, { x: 0.3, y: 0.3 }), null);
});

test('clicks outside the hotspot do not advance the flow', () => {
  const data = flow();
  assert.equal(followHotspot(data, data.frames[0].id, { x: 0.1, y: 0.1 }), null);
});

test('clips a partially visible target and normalizes to screenshot coordinates', () => {
  assert.deepEqual(normalizeHotspot({ x: -100, y: 450, width: 300, height: 100 },
    { width: 1000, height: 500 }), { x: 0, y: 0.9, width: 0.2, height: 0.1 });
  assert.throws(() => normalizeHotspot({ x: 1200, y: 0, width: 10, height: 10 },
    { width: 1000, height: 500 }), /HOTSPOT_OUTSIDE_VIEWPORT/);
});

for (const [name, mutate] of [
  ['duplicate frame IDs', (f) => { f.frames[1].id = f.frames[0].id; }],
  ['dangling transition', (f) => { f.transitions[0].toFrameId = id(); }],
  ['backward transition', (f) => { f.transitions[1].toFrameId = f.frames[0].id; }],
  ['skipped frame', (f) => { f.transitions[0].toFrameId = f.frames[2].id; }],
  ['two outgoing transitions', (f) => { f.transitions[1] = structuredClone(f.transitions[0]); }],
  ['oversized hotspot', (f) => { f.transitions[0].hotspot.width = 0.9; }],
  ['unknown fields', (f) => { f.accessToken = 'never persist this'; }],
  ['non-finite coordinates', (f) => { f.transitions[0].hotspot.x = NaN; }],
  ['secret-bearing source URL', (f) => { f.frames[0].sourceUrl += '?token=secret'; }],
]) {
  test(`rejects ${name}`, () => {
    const data = flow(); mutate(data);
    assert.equal(flowSchema.safeParse(data).success, false);
  });
}

test('drafts can be incomplete, but publish validation rejects missing links', () => {
  const data = flow(); data.transitions.pop();
  assert.doesNotThrow(() => parseFlow(data));
  assert.throws(() => requirePlayableFlow(data), /FLOW_HAS_MISSING_TRANSITIONS/);
});

test('removes credentials, all query parameters and fragments before storing source URLs', () => {
  assert.equal(sanitizeSourceUrl('https://user:password@example.com/path?a=1#secret'), 'https://example.com/path');
  for (const value of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,test']) {
    assert.throws(() => sanitizeSourceUrl(value), /UNSUPPORTED_URL_SCHEME/);
  }
});

test('rejects dangerous image metadata sizes and unsupported formats', () => {
  for (const changes of [{ byteLength: 11 * 1024 * 1024 }, { width: 0 },
    { width: 8000, height: 8000 }, { mimeType: 'image/svg+xml' }]) {
    assert.equal(imageSchema.safeParse(image(changes)).success, false);
  }
});
