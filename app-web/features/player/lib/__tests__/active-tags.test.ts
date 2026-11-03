import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterActiveTags } from '../active-tags.ts';

/**
 * Тести алгоритму просторово-часової прив'язки тегів (Розділ 2.4).
 * A(τ) = { Tᵢ : tᵢ ≤ τ ≤ tᵢ + dᵢ }.
 */

type Tag = { id: string; time: number; duration: number };

const make = (id: string, time: number, duration: number): Tag => ({
  id,
  time,
  duration,
});

test('тег невидимий до моменту tᵢ', () => {
  const tags = [make('a', 10, 5)];
  assert.deepEqual(filterActiveTags(tags, 5, 5), []);
});

test('тег видимий у момент появи τ = tᵢ', () => {
  const tags = [make('a', 10, 5)];
  assert.deepEqual(
    filterActiveTags(tags, 10, 5).map((t) => t.id),
    ['a'],
  );
});

test('тег видимий у точці закриття τ = tᵢ + dᵢ (включно)', () => {
  const tags = [make('a', 10, 5)];
  assert.deepEqual(
    filterActiveTags(tags, 15, 5).map((t) => t.id),
    ['a'],
  );
});

test('тег невидимий після tᵢ + dᵢ', () => {
  const tags = [make('a', 10, 5)];
  assert.deepEqual(filterActiveTags(tags, 15.001, 5), []);
});

test('кілька тегів — повертаються тільки активні', () => {
  const tags = [
    make('a', 0, 5),
    make('b', 4, 5),
    make('c', 20, 5),
  ];
  const ids = filterActiveTags(tags, 4.5, 5).map((t) => t.id);
  assert.deepEqual(ids.sort(), ['a', 'b']);
});

test('fallbackDurationSec застосовується, якщо duration ≤ 0', () => {
  const tags = [make('a', 0, 0)];
  assert.equal(filterActiveTags(tags, 3, 5).length, 1);
  assert.equal(filterActiveTags(tags, 6, 5).length, 0);
});

test('індивідуальна dᵢ перекриває fallback', () => {
  const tags = [make('a', 0, 2)];
  assert.equal(filterActiveTags(tags, 3, 10).length, 0);
});

test('порожній масив повертає порожній', () => {
  assert.deepEqual(filterActiveTags([], 5, 5), []);
});
