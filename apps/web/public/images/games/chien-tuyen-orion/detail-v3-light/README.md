# Orion Light V3 — web assets

Base URL: `/images/games/chien-tuyen-orion/detail-v3-light/`.

## Mapping

- Hero: `hero.webp`, mobile: `hero-mobile.webp`.
- Roles: `role-assault.webp`, `role-recon.webp`, `role-support.webp`; thumbnail variants end in `-thumb.webp`.
- Battlefield panorama: `battlefield-panorama.webp`.
- Locations: `location-helix.webp`, `location-orion-belt.webp`, `location-anomaly.webp`; thumbnail variants end in `-thumb.webp`.
- Equipment: `equipment-strip.webp`, or responsive individual crops `equipment-weapon.webp`, `equipment-armor.webp`, `equipment-device.webp`.
- News/community artwork can reuse location, role and hero assets with different CSS focal points. Do not duplicate downloads.

Use `<picture>` for hero, preload only desktop/mobile hero selected by the browser, and lazy-load all lower assets. Preserve width/height from `manifest.json`. Add white-to-transparent gradient in HTML/CSS on the hero; it is intentionally not baked into artwork. Iconography, labels and clipped-corner masks belong in code.

Suggested `lucide-react` icons: `Crosshair`, `ScanEye`, `Shield`, `Monitor`, `Smartphone`, `ArrowRight`. Do not trace decorative symbols from the mockup.

Images are generated/reconstructed illustrations from the Orion key art; they are not gameplay screenshots. The first station generation containing accidental signage was rejected and is not included.

Prompts and PNG sources: `design/resources/orion-detail-v3-light/`.
