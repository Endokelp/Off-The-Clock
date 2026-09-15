import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evidenceExportEntitlement,
  hasEvidenceExport,
  isAppUserId,
  newAppUserId,
  webPurchaseLink,
} from './entitlement.ts';

const customerWith = (...active: string[]) => ({
  entitlements: { active: Object.fromEntries(active.map((name) => [name, { isActive: true }])) },
});

test('the export is locked until the entitlement is granted', () => {
  assert.equal(hasEvidenceExport(customerWith()), false);
  assert.equal(hasEvidenceExport(customerWith(evidenceExportEntitlement)), true);
});

test('an unrelated entitlement does not unlock the export', () => {
  assert.equal(hasEvidenceExport(customerWith('something_else')), false);
});

test('a minted app user id is url safe and recognised on the way back out of storage', () => {
  const id = newAppUserId();
  assert.ok(isAppUserId(id));
  assert.equal(encodeURIComponent(id), id);
});

test('two ids minted in the same millisecond still differ', () => {
  const ids = new Set(Array.from({ length: 500 }, newAppUserId));
  assert.equal(ids.size, 500);
});

test('storage that holds anything other than an id is rejected', () => {
  for (const stored of [null, undefined, '', 42, {}, '$RCAnonymousID:abc', 'otc-']) {
    assert.equal(isAppUserId(stored), false);
  }
});

test('the parent link carries the customer as a path segment', () => {
  assert.equal(
    webPurchaseLink('abc123', 'otc-m1x2y3-9f8e7d6c'),
    'https://pay.rev.cat/abc123/otc-m1x2y3-9f8e7d6c',
  );
});

test('there is no parent link until a web token is configured', () => {
  assert.equal(webPurchaseLink('', 'otc-m1x2y3-9f8e7d6c'), null);
});
