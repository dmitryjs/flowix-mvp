import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessWorkspace } from '../packages/core/src/access.ts';
import { id, now } from './fixtures.mjs';

function identity(role = 'editor') {
  const principal = { userId: id(), expiresAt: now + 1000 };
  const membership = { userId: principal.userId, workspaceId: id(), role, status: 'active' };
  return { principal, membership };
}

test('owner, editor and viewer have distinct permissions', () => {
  for (const [role, expected] of [
    ['owner', [true, true, true]], ['editor', [true, true, false]], ['viewer', [true, false, false]],
  ]) {
    const { principal, membership } = identity(role);
    assert.deepEqual(['read', 'write', 'manage_members'].map((action) =>
      canAccessWorkspace(principal, membership, membership.workspaceId, action, now)), expected);
  }
});

test('denies cross-workspace and cross-user access, even for an owner', () => {
  const { principal, membership } = identity('owner');
  assert.equal(canAccessWorkspace(principal, membership, id(), 'read', now), false);
  assert.equal(canAccessWorkspace({ ...principal, userId: id() }, membership, membership.workspaceId, 'read', now), false);
});

test('denies expired sessions and revoked membership', () => {
  const { principal, membership } = identity('owner');
  assert.equal(canAccessWorkspace({ ...principal, expiresAt: now }, membership, membership.workspaceId, 'read', now), false);
  assert.equal(canAccessWorkspace(principal, { ...membership, status: 'revoked' }, membership.workspaceId, 'read', now), false);
});

test('denies missing identity, invented roles/actions, malformed input and invalid time', () => {
  const { principal, membership } = identity();
  for (const [p, m, action, time] of [
    [null, membership, 'read', now], [principal, null, 'read', now],
    [principal, { ...membership, role: 'super_admin' }, 'read', now],
    [principal, membership, 'download_everything', now], [principal, membership, 'read', NaN],
  ]) assert.equal(canAccessWorkspace(p, m, membership.workspaceId, action, time), false);
});
