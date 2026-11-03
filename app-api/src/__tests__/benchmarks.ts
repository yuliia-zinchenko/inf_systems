/**
 * Бенчмарки чистих алгоритмів для розділу 3.4 курсової.
 * Запуск: cd app-api && node --experimental-strip-types src/__tests__/benchmarks.ts
 *
 * Виміри робляться як медіана з N прогонів — це стійкіше за середнє.
 */
import { createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import { performance } from 'node:perf_hooks';
import {
  pickMeta,
  extractTitleTag,
  decodeEntities,
  toAbsoluteUrl,
} from '../product-tags/scrape.helpers.ts';
import { hashIp } from '../analytics/analytics.services.ts';

const N = 100; // повторів для статистики

function bench(label: string, fn: () => void): { p50: number; p95: number; min: number } {
  // warmup
  for (let i = 0; i < 10; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < N; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(N * 0.5)] ?? 0;
  const p95 = times[Math.floor(N * 0.95)] ?? 0;
  const min = times[0] ?? 0;
  const fmt = (n: number) => (n < 1 ? `${(n * 1000).toFixed(1)} мкс` : `${n.toFixed(2)} мс`);
  console.log(`${label.padEnd(50)} p50=${fmt(p50).padEnd(12)} p95=${fmt(p95).padEnd(12)} min=${fmt(min)}`);
  return { p50, p95, min };
}

async function benchAsync(label: string, fn: () => Promise<unknown>): Promise<void> {
  for (let i = 0; i < 3; i++) await fn();
  const times: number[] = [];
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(20 * 0.5)] ?? 0;
  console.log(`${label.padEnd(50)} p50=${p50.toFixed(2)} мс`);
}

console.log(`\n=== Бенчмарки чистих алгоритмів (N=${N}) ===\n`);

// 1. hashIp
bench('hashIp(ip) — SHA-256 з сіллю + усічення', () => {
  hashIp('203.0.113.45');
});

// 2. filterActiveTags
const tags = Array.from({ length: 50 }, (_, i) => ({
  id: `tag-${i}`,
  time: i * 2,
  duration: 5,
}));
bench('filterActiveTags(50 тегів, τ=10)', () => {
  tags.filter((t) => t.time <= 10 && 10 <= t.time + t.duration);
});

// 3. OpenGraph-парсер
const html = `
<html><head>
  <title>Nike Air Max — Magazin</title>
  <meta property="og:title" content="Nike Air Max 270 Black">
  <meta property="og:image" content="/img/nike-270.jpg">
  <meta property="og:image:secure_url" content="https://cdn.shop.com/nike-270.jpg">
  <meta name="twitter:title" content="Nike Air Max 270">
  <meta name="twitter:image" content="https://cdn.shop.com/nike-twitter.jpg">
  <meta property="og:description" content="...">
</head><body>...</body></html>
`.repeat(20); // імітуємо реальну сторінку ~3 КБ
const base = new URL('https://shop.example.com/p/nike-270');

bench('OpenGraph: pickMeta(og:title)', () => {
  pickMeta(html, ['og:title', 'twitter:title']);
});
bench('OpenGraph: extractTitleTag', () => {
  extractTitleTag(html);
});
bench('OpenGraph: toAbsoluteUrl', () => {
  toAbsoluteUrl('/img/x.jpg', base);
});
bench('OpenGraph: decodeEntities', () => {
  decodeEntities('Tom &amp; Jerry &#39;hi&#39; &#1040;');
});

// 4. SHA-256 з сіллю (для порівняння)
bench('SHA-256(salt||ip) raw (node:crypto)', () => {
  createHash('sha256').update('salt|203.0.113.45').digest('hex');
});

// 5. bcrypt — основна вартість входу
console.log('\n--- Асинхронні бенчмарки ---');
await benchAsync('bcrypt.hash("password123", cost=12)', async () => {
  await bcrypt.hash('password123', 12);
});
const storedHash = await bcrypt.hash('password123', 12);
await benchAsync('bcrypt.compare("password123", storedHash)', async () => {
  await bcrypt.compare('password123', storedHash);
});

console.log('\n=== Готово ===\n');
