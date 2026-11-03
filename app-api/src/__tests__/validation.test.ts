import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../application/middlewares/validation.middleware.ts';
import { ValidationException } from '../application/exceptions/http.exception.ts';
import {
  productTagCreateSchema,
  productTagUpdateSchema,
} from '../product-tags/product-tag.schema.ts';

/**
 * Тести валідаційного шару (схеми ProductTag).
 * Перевіряє межі та обов'язковість полів, що захищають інваріанти моделі з Розділу 2.4.
 */

interface FakeReq {
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

function runValidate(
  source: 'body' | 'params' | 'query',
  schema: Parameters<typeof validate>[1],
  data: Record<string, unknown>,
): { ok: true; req: FakeReq } | { ok: false; message: string } {
  const req: FakeReq = { [source]: { ...data } };
  let nextErr: unknown = null;
  try {
    validate(source, schema)(req as never, {} as never, (e?: unknown) => {
      nextErr = e;
    });
  } catch (e) {
    nextErr = e;
  }
  if (nextErr) {
    return {
      ok: false,
      message: nextErr instanceof Error ? nextErr.message : String(nextErr),
    };
  }
  return { ok: true, req };
}

test('productTagCreate: валідний об\'єкт проходить', () => {
  const r = runValidate('body', productTagCreateSchema, {
    time: 10,
    duration: 5,
    title: 'Nike Air',
    imageUrl: 'https://shop.com/nike.jpg',
    link: 'https://shop.com/p/nike',
    variant: 'card',
    accentColor: 'fuchsia',
    positionX: 50,
    positionY: 80,
  });
  assert.equal(r.ok, true);
});

test('productTagCreate: відсутній title — помилка', () => {
  const r = runValidate('body', productTagCreateSchema, {
    time: 0,
    imageUrl: 'x',
    link: 'y',
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.message, /title.*required/i);
});

test('productTagCreate: від\'ємний time — помилка (інваріант t_i ≥ 0)', () => {
  const r = runValidate('body', productTagCreateSchema, {
    time: -1,
    title: 't',
    imageUrl: 'x',
    link: 'y',
  });
  assert.equal(r.ok, false);
});

test('productTagCreate: duration > 60 — помилка (межа d_i ∈ [0.5; 60])', () => {
  const r = runValidate('body', productTagCreateSchema, {
    time: 0,
    duration: 120,
    title: 't',
    imageUrl: 'x',
    link: 'y',
  });
  assert.equal(r.ok, false);
});

test('productTagCreate: positionX > 100 — помилка (нормалізована координата)', () => {
  const r = runValidate('body', productTagCreateSchema, {
    time: 0,
    title: 't',
    imageUrl: 'x',
    link: 'y',
    positionX: 150,
  });
  assert.equal(r.ok, false);
});

test('productTagCreate: невідомий variant — помилка', () => {
  const r = runValidate('body', productTagCreateSchema, {
    time: 0,
    title: 't',
    imageUrl: 'x',
    link: 'y',
    variant: 'huge-banner',
  });
  assert.equal(r.ok, false);
});

test('productTagUpdate: усі поля опціональні (порожній patch ок)', () => {
  const r = runValidate('body', productTagUpdateSchema, {});
  assert.equal(r.ok, true);
});

test('ValidationException: створюється з повідомленням', () => {
  const e = new ValidationException('bad');
  assert.equal(e.message, 'bad');
});
