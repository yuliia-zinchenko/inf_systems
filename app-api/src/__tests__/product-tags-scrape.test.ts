import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickMeta,
  extractTitleTag,
  toAbsoluteUrl,
  decodeEntities,
  isExternalUrl,
} from '../product-tags/scrape.helpers.ts';

/**
 * Тести для алгоритму видобутку метаданих товару (Розділ 2.7).
 * Перевіряють best-effort парсинг OpenGraph / Twitter Cards / <title>.
 */

test('pickMeta: знаходить og:title у будь-якому порядку атрибутів', () => {
  const html = `<meta content="Nike Air" property="og:title">`;
  assert.equal(pickMeta(html, ['og:title']), 'Nike Air');
});

test('pickMeta: приймає name= як еквівалент property=', () => {
  const html = `<meta name="twitter:title" content="Adidas">`;
  assert.equal(pickMeta(html, ['twitter:title']), 'Adidas');
});

test('pickMeta: пробує властивості по порядку, повертає першу знайдену', () => {
  const html = `<meta property="twitter:title" content="Twitter">`;
  assert.equal(pickMeta(html, ['og:title', 'twitter:title']), 'Twitter');
});

test('pickMeta: повертає null, якщо нічого не знайдено', () => {
  assert.equal(pickMeta('<html></html>', ['og:title']), null);
});

test('pickMeta: не плутає property з іншим тегом', () => {
  const html = `<meta property="og:description" content="опис">`;
  assert.equal(pickMeta(html, ['og:title']), null);
});

test('extractTitleTag: витягує текст <title>', () => {
  assert.equal(extractTitleTag('<title>Магазин</title>'), 'Магазин');
});

test('extractTitleTag: повертає null, якщо <title> відсутній', () => {
  assert.equal(extractTitleTag('<html></html>'), null);
});

test('toAbsoluteUrl: розгортає відносний шлях', () => {
  const base = new URL('https://shop.example.com/p/123');
  assert.equal(toAbsoluteUrl('/img/x.jpg', base), 'https://shop.example.com/img/x.jpg');
});

test('toAbsoluteUrl: пропускає вже абсолютну URL', () => {
  const base = new URL('https://shop.example.com');
  assert.equal(
    toAbsoluteUrl('https://cdn.example.com/x.jpg', base),
    'https://cdn.example.com/x.jpg',
  );
});

test('toAbsoluteUrl: повертає null на невалідній URL', () => {
  assert.equal(toAbsoluteUrl('http://[::bad', new URL('https://x.com')), null);
});

test('decodeEntities: декодує HTML-сутності', () => {
  assert.equal(decodeEntities('Tom &amp; Jerry &#39;hi&#39;'), `Tom & Jerry 'hi'`);
});

test('decodeEntities: декодує числові entity', () => {
  assert.equal(decodeEntities('&#1040;&#1041;'), 'АБ');
});

test('isExternalUrl: відрізняє повну URL від storage-ключа', () => {
  assert.equal(isExternalUrl('https://cdn.shop.com/x.jpg'), true);
  assert.equal(isExternalUrl('http://x.com'), true);
  assert.equal(isExternalUrl('images/uuid-1.jpg'), false);
  assert.equal(isExternalUrl(''), false);
});
