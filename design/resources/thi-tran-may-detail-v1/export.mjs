import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const base = '/images/games/thi-tran-may';
const out = join(root, 'apps/web/public', base, 'detail-v1');
const game = join(root, 'apps/web/public', base);
mkdirSync(out, { recursive: true });

// Resize proportionally, never upscale or crop. Only this version's outputs are replaced.
const entries = [
  ['hero', join(game, 'key-art.png'), 1600, 'Thị trấn nổi giữa bầu trời và những tầng mây', '58% 48%', 'existing-key-art'],
  ['heroMobile', join(game, 'hero-mobile.webp'), 1080, 'Thị trấn và tháp đồng hồ trên đảo mây', '50% 50%', 'existing-mobile-art'],
  ['townSquare', join(here, 'town-square.png'), 1200, 'Quảng trường và tháp đồng hồ của Thị Trấn Mây', '50% 50%', 'ai-reconstruction'],
  ['garden', join(here, 'garden.png'), 1200, 'Khu vườn và những ngôi nhà trên đảo mây', '50% 55%', 'ai-reconstruction'],
  ['airships', join(here, 'airships.png'), 1200, 'Khinh khí cầu bay trên những tầng mây', '60% 45%', 'ai-reconstruction'],
  ['floatingIslands', join(here, 'floating-islands.png'), 1800, 'Quần thể đảo mây kết nối quanh thị trấn', '45% 50%', 'ai-reconstruction'],
  ['townSquareThumb', join(here, 'town-square.png'), 640, 'Quảng trường', '50% 50%', 'ai-reconstruction'],
  ['gardenThumb', join(here, 'garden.png'), 640, 'Khu vườn', '50% 55%', 'ai-reconstruction'],
  ['airshipsThumb', join(here, 'airships.png'), 640, 'Khinh khí cầu', '60% 45%', 'ai-reconstruction'],
  ['floatingIslandsThumb', join(here, 'floating-islands.png'), 640, 'Đảo mây', '45% 50%', 'ai-reconstruction'],
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
  game: 'thi-tran-may',
  design: 'design/thi-tran-may-detail-v1.png',
  note: 'Concept illustrations; AI reconstructions are not exact extracted layers or gameplay screenshots.',
  slots: {
    hero: 'hero',
    heroMobile: 'heroMobile',
    introduction: 'townSquare',
    experiencePillars: ['townSquareThumb', 'gardenThumb', 'floatingIslandsThumb'],
    galleryPanorama: 'floatingIslands',
    gallery: ['townSquare', 'garden', 'airships'],
    galleryThumbs: ['townSquareThumb', 'gardenThumb', 'airshipsThumb'],
    closingBanner: 'floatingIslands',
  },
  assets,
};

writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
