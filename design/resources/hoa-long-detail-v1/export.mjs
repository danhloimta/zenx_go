import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const base = '/images/games/vuong-trieu-hoa-long';
const out = join(root, 'apps/web/public', base, 'detail-v1');
const game = join(root, 'apps/web/public', base);
mkdirSync(out, { recursive: true });
// Resize proportionally, never upscale or crop. Only this version's outputs are replaced.
const entries = [
  ['hero', join(game, 'key-art.png'), 1600, 'Hỏa long bao trùm vương quốc núi lửa', '65% 45%', 'existing-key-art'],
  ['heroMobile', join(game, 'hero-mobile.webp'), 1080, 'Hỏa long giữa khói lửa', '50% 50%', 'existing-mobile-art'],
  ['fortress', join(here, 'fortress.png'), 1200, 'Thành trì giữa thung lũng núi lửa', '50% 50%', 'ai-reconstruction'],
  ['dragon', join(here, 'dragon.png'), 1200, 'Cận cảnh hỏa long với vảy đen và mắt rực lửa', '55% 48%', 'ai-reconstruction'],
  ['battlefield', join(here, 'battlefield.png'), 1200, 'Đoàn quân và cờ hiệu trước thành trì', '50% 55%', 'ai-reconstruction'],
  ['fortressThumb', join(here, 'fortress.png'), 640, 'Thành trì', '50% 50%', 'ai-reconstruction'],
  ['dragonThumb', join(here, 'dragon.png'), 640, 'Hỏa long', '55% 48%', 'ai-reconstruction'],
  ['battlefieldThumb', join(here, 'battlefield.png'), 640, 'Chiến địa', '50% 55%', 'ai-reconstruction'],
  ['ctaEmbers', join(here, 'cta-embers.png'), 1600, '', '50% 50%', 'ai-reconstruction'],
];
const assets = {};
for (const [id, source, width, alt, objectPosition, provenance] of entries) {
  const name = id.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) + '.webp';
  const file = join(out, name);
  execFileSync('magick', [source, '-resize', `${width}>`, '-strip', '-quality', '84', file]);
  const [w, h, bytes] = execFileSync('magick', ['identify', '-format', '%w %h %B', file], { encoding: 'utf8' }).trim().split(' ').map(Number);
  assets[id] = { src: `${base}/detail-v1/${name}`, width: w, height: h, bytes, alt, objectPosition, provenance };
}
const manifest = {
  version: 1,
  game: 'vuong-trieu-hoa-long',
  design: 'design/vuong-trieu-hoa-long-detail-v1.png',
  note: 'Concept illustrations; AI reconstructions are not exact extracted layers or gameplay screenshots.',
  slots: { hero: 'hero', heroMobile: 'heroMobile', introduction: 'fortress', galleryPanorama: 'hero', gallery: ['dragon', 'fortress', 'battlefield'], galleryThumbs: ['dragonThumb', 'fortressThumb', 'battlefieldThumb'], closingBanner: 'ctaEmbers' },
  assets,
};
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
