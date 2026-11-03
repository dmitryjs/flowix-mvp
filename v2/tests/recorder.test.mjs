import test from 'node:test';
import assert from 'node:assert/strict';
import { startRecording, reserveCapture, commitCapture, setRecordingStatus,
  recoverRecording, updateSession } from '../packages/core/src/recorder.ts';
import { context, identifiers, image, id, now } from './fixtures.mjs';

const start = () => startRecording(identifiers(), context(), now);
const reserve = (session, captureId = id()) => reserveCapture(session, captureId, context(), session.revision, now);

test('capture state survives serialization and commits in recording order', () => {
  let session = reserve(start());
  const firstId = session.pending.captureId;
  session = JSON.parse(JSON.stringify(session));
  session = commitCapture(session, firstId, image(), context(), session.revision, now + 100);
  const secondId = id();
  session = reserveCapture(session, secondId, context(), session.revision, now + 600);
  session = commitCapture(session, secondId, image(), context(), session.revision, now + 700);
  assert.deepEqual(session.frames.map((frame) => frame.id), [firstId, secondId]);
  assert.equal(session.frames[0].sourceUrl, 'https://example.com/settings');
});

for (const [name, changes, error] of [
  ['another tab', { tabId: 18 }, /WRONG_CAPTURE_TAB/],
  ['another window', { windowId: 3 }, /WRONG_CAPTURE_TAB/],
  ['an inactive tab', { active: false }, /RECORDED_TAB_NOT_ACTIVE/],
  ['cross-origin navigation', { url: 'https://other.example.com/settings' }, /ORIGIN_CHANGED/],
  ['an iframe', { frameId: 1 }, /Invalid input/],
]) {
  test(`does not reserve a screenshot from ${name}`, () => {
    const session = start();
    assert.throws(() => reserveCapture(session, id(), context(changes), session.revision, now), error);
  });
}

test('a second capture cannot overtake one already in progress', () => {
  const session = reserve(start());
  assert.throws(() => reserveCapture(session, id(), context(), session.revision, now + 1000), /CAPTURE_BUSY/);
  assert.equal(session.frames.length, 0);
});

test('capture rate limit remains after a worker restart', () => {
  let session = reserve(start());
  session = commitCapture(session, session.pending.captureId, image(), context(), session.revision, now + 10);
  session = JSON.parse(JSON.stringify(session));
  assert.throws(() => reserveCapture(session, id(), context(), session.revision, now + 100), /CAPTURE_RATE_LIMIT/);
});

test('a stale command cannot mutate a newer recording', () => {
  const session = reserve(start());
  assert.throws(() => setRecordingStatus(session, 'stopped', 0), /REVISION_CONFLICT/);
});

test('commit retry is idempotent and rejects replacement content for the same capture', () => {
  const reserved = reserve(start());
  const captureId = reserved.pending.captureId;
  const asset = image();
  const committed = commitCapture(reserved, captureId, asset, context(), reserved.revision, now + 10);
  assert.deepEqual(commitCapture(committed, captureId, asset, context(), reserved.revision, now + 20), committed);
  assert.throws(() => commitCapture(committed, captureId, image(), context(), reserved.revision, now + 20), /IDEMPOTENCY_CONFLICT/);
  assert.throws(() => commitCapture(committed, captureId, { ...asset, sha256: 'b'.repeat(64) },
    context(), reserved.revision, now + 20), /IDEMPOTENCY_CONFLICT/);
});

for (const [name, changed] of [
  ['document navigation', { documentId: 'document-B' }],
  ['SPA route navigation', { url: 'https://example.com/other' }],
  ['viewport resize', { viewport: { width: 1000, height: 900 } }],
  ['DOM update or scroll without URL navigation', { documentVersion: 2 }],
]) {
  test(`does not associate a screenshot with the wrong click after ${name}`, () => {
    const session = reserve(start());
    assert.throws(() => commitCapture(session, session.pending.captureId, image(), context(changed),
      session.revision, now + 100), /DOCUMENT_CHANGED_DURING_CAPTURE/);
  });
}

test('tab switching during capture rejects the result', () => {
  const session = reserve(start());
  assert.throws(() => commitCapture(session, session.pending.captureId, image(), context({ tabId: 18 }),
    session.revision, now + 10), /WRONG_CAPTURE_TAB/);
});

test('stop retains completed work and prevents late screenshots or accidental resume', () => {
  let session = reserve(start());
  session = commitCapture(session, session.pending.captureId, image(), context(), session.revision, now + 10);
  session = reserveCapture(session, id(), context(), session.revision, now + 600);
  const pendingId = session.pending.captureId;
  session = setRecordingStatus(session, 'stopped', session.revision);
  assert.equal(session.frames.length, 1);
  assert.equal(session.pending, null);
  assert.throws(() => commitCapture(session, pendingId, image(), context(), session.revision, now + 700), /NOT_RECORDING/);
  assert.throws(() => setRecordingStatus(session, 'recording', session.revision), /SESSION_ALREADY_STOPPED/);
});

test('recovery pauses abandoned work without fabricating a new screenshot', () => {
  const session = recoverRecording(JSON.parse(JSON.stringify(reserve(start()))));
  assert.equal(session.status, 'paused');
  assert.equal(session.pending, null);
  assert.equal(session.frames.length, 0);
  assert.deepEqual(recoverRecording(session), session);
});

test('concurrent commands resolve to one atomic reservation with compare-and-swap', async () => {
  let stored = start();
  const original = structuredClone(stored);
  const store = {
    async read() { return structuredClone(stored); },
    async compareAndSwap(_id, revision, next) {
      if (stored.revision !== revision) return false;
      stored = structuredClone(next);
      return true;
    },
  };
  const results = await Promise.allSettled([id(), id()].map((captureId) => updateSession(
    store, original.id, 0, (session) => reserveCapture(session, captureId, context(), session.revision, now),
  )));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal(stored.revision, 1);
  assert.ok(stored.pending.captureId);
});

test('a faulty reducer cannot move a session into another workspace', async () => {
  const original = start();
  const store = { async read() { return original; }, async compareAndSwap() { assert.fail('must not write'); } };
  await assert.rejects(updateSession(store, original.id, 0,
    (session) => ({ ...session, workspaceId: id(), revision: 1 })), /SESSION_IDENTITY_CHANGED/);
});
