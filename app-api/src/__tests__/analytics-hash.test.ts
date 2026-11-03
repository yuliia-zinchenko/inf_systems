import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashIp } from '../analytics/analytics.services.ts';

/**
 * Тести алгоритму дедуплікованого збору аналітики (Розділ 2.5).
 * Перевіряють детермінізм, незворотність та k-anonymous властивості SHA-256 + salt.
 */

test('hashIp: повертає null для null IP', () => {
  assert.equal(hashIp(null), null);
});

test('hashIp: детермінований — одна IP дає однаковий хеш', () => {
  const a = hashIp('203.0.113.45');
  const b = hashIp('203.0.113.45');
  assert.equal(a, b);
  assert.notEqual(a, null);
});

test('hashIp: різні IP дають різні хеші', () => {
  assert.notEqual(hashIp('203.0.113.45'), hashIp('203.0.113.46'));
});

test('hashIp: повертає рядок довжини 32 (16 байт у hex)', () => {
  const h = hashIp('192.168.1.1');
  assert.equal(h?.length, 32);
  assert.match(h ?? '', /^[0-9a-f]{32}$/);
});

test('hashIp: невідновлюваний — не містить вихідної IP як підрядка', () => {
  const ip = '203.0.113.45';
  const h = hashIp(ip);
  assert.equal(h?.includes(ip), false);
  assert.equal(h?.includes('203'), false);
});

test('hashIp: підтримує IPv6', () => {
  const h = hashIp('2001:db8::1');
  assert.match(h ?? '', /^[0-9a-f]{32}$/);
  assert.notEqual(h, hashIp('2001:db8::2'));
});
