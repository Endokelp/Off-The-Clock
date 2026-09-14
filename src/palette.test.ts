import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contrastRatio, dark, light } from './palette.ts';

// WCAG AA is 4.5 to 1 for body text and 3 to 1 for large text. The money figure is the only
// thing drawn in the accent and it is always large, so it is held to 3 and the rest to 4.5.
const bodyMinimum = 4.5;
const largeTextMinimum = 3;

test('the known contrast anchors are computed correctly', () => {
  assert.equal(Math.round(contrastRatio('#FFFFFF', '#000000') * 100) / 100, 21);
  assert.equal(contrastRatio('#FFFFFF', '#FFFFFF'), 1);
});

for (const [name, scheme] of [
  ['dark', dark],
  ['light', light],
] as const) {
  test(`${name} body text clears WCAG AA`, () => {
    for (const [layer, background] of [
      ['background', scheme.background],
      ['surface', scheme.surface],
      ['surfaceVariant', scheme.surfaceVariant],
    ] as const) {
      const primary = contrastRatio(scheme.onSurface, background);
      const secondary = contrastRatio(scheme.onSurfaceVariant, background);
      assert.ok(primary >= bodyMinimum, `${name} onSurface on ${layer} is ${primary.toFixed(2)}`);
      assert.ok(
        secondary >= bodyMinimum,
        `${name} onSurfaceVariant on ${layer} is ${secondary.toFixed(2)}`,
      );
    }
  });

  test(`${name} money figure and error text are legible`, () => {
    const money = contrastRatio(scheme.money, scheme.background);
    const onMoney = contrastRatio(scheme.onMoney, scheme.money);
    const error = contrastRatio(scheme.error, scheme.surface);
    assert.ok(money >= largeTextMinimum, `${name} money on background is ${money.toFixed(2)}`);
    assert.ok(onMoney >= bodyMinimum, `${name} button label on accent is ${onMoney.toFixed(2)}`);
    assert.ok(error >= bodyMinimum, `${name} error on surface is ${error.toFixed(2)}`);
  });
}
