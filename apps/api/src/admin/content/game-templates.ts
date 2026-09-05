import { DomainError, ErrorCode } from '../../common/errors';
import { assertAssetUrl, assertCtaPath } from './content-markdown';

export const GAME_TEMPLATE_PRESETS = [
  'EDITORIAL_FANTASY',
  'DARK_STRATEGY',
  'PLAYFUL_CASUAL',
  'SCI_FI_SHOOTER',
] as const;

export type GameTemplatePreset = (typeof GAME_TEMPLATE_PRESETS)[number];

export type GameThemeConfig = {
  primary: string;
  secondary: string;
  surface: string;
  text: string;
  heading: string;
  body: string;
  radius: string;
  motion: string;
  [key: string]: unknown;
};

export type GamePageItem = {
  title: string;
  description?: string;
  imageUrl?: string | null;
  eyebrow?: string;
  href?: string | null;
  [key: string]: unknown;
};

export type GamePageConfig = {
  schemaVersion: number;
  preset: GameTemplatePreset;
  /** Temporary compatibility marker for the four seeded sites during rollout. */
  legacyRenderer?: GameTemplatePreset;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    mobileImageUrl?: string | null;
  };
  intro: {
    eyebrow: string;
    title: string;
    description: string;
    imageUrl?: string | null;
  };
  featureCards: GamePageItem[];
  gallery: GamePageItem[];
  faqs: Array<{ question: string; answer: string }>;
  roles: GamePageItem[];
  locations: GamePageItem[];
  equipment: GamePageItem[];
  closing: { eyebrow: string; title: string; description: string; imageUrl?: string | null };
};

type TemplateDefinition = {
  id: GameTemplatePreset;
  name: string;
  description: string;
  thumbnailUrl: string;
  theme: GameThemeConfig;
  featureConfig: Record<string, unknown>;
  required: string[];
};

const sharedFeatures = {
  sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ROADMAP_PREVIEW', 'ARTICLE_GRID', 'COMMUNITY_CTA'],
  routes: ['ABOUT', 'NEWS', 'ROADMAP'],
  downloads: false,
  servers: false,
  leaderboard: false,
  giftcode: false,
  gameTopup: false,
};

const definitions: Record<GameTemplatePreset, TemplateDefinition> = {
  EDITORIAL_FANTASY: {
    id: 'EDITORIAL_FANTASY',
    name: 'Editorial Fantasy',
    description: 'Bố cục tạp chí giàu hình ảnh, phù hợp fantasy, nhập vai và phiêu lưu.',
    thumbnailUrl: '/images/games/luc-dia-dam-me/hero.webp',
    theme: { primary: '#54796f', secondary: '#778fa0', surface: '#edf2f3', text: '#203236', heading: 'serif', body: 'sans-serif', radius: 'medium', motion: 'subtle' },
    featureConfig: sharedFeatures,
    required: ['hero.imageUrl', 'intro.description', 'featureCards:3', 'gallery:3', 'closing.title'],
  },
  DARK_STRATEGY: {
    id: 'DARK_STRATEGY',
    name: 'Dark Strategy',
    description: 'Không khí chiến lược tối, tương phản cao, phù hợp game chiến thuật.',
    thumbnailUrl: '/images/games/vuong-trieu-hoa-long/hero-desktop.webp',
    theme: { primary: '#9b4938', secondary: '#c89254', surface: '#1e1b1c', text: '#fff4df', heading: 'display-serif', body: 'sans-serif', radius: 'small', motion: 'cinematic' },
    featureConfig: sharedFeatures,
    required: ['hero.imageUrl', 'intro.description', 'featureCards:3', 'gallery:3', 'closing.title'],
  },
  PLAYFUL_CASUAL: {
    id: 'PLAYFUL_CASUAL',
    name: 'Playful Casual',
    description: 'Giao diện sáng, thân thiện, bo góc mềm và nhịp chuyển động vui tươi.',
    thumbnailUrl: '/images/games/thi-tran-may/hero-desktop.webp',
    theme: { primary: '#69bce8', secondary: '#f6c958', surface: '#fffdf7', text: '#193b5a', heading: 'rounded-sans', body: 'sans-serif', radius: 'large', motion: 'playful' },
    featureConfig: sharedFeatures,
    required: ['hero.imageUrl', 'intro.description', 'featureCards:3', 'gallery:3', 'closing.title'],
  },
  SCI_FI_SHOOTER: {
    id: 'SCI_FI_SHOOTER',
    name: 'Sci‑Fi Shooter',
    description: 'Phong cách tactical sci-fi, nền tối, typography kỹ thuật và điểm nhấn neon.',
    thumbnailUrl: '/images/games/chien-tuyen-orion/hero-desktop.webp',
    theme: { primary: '#6c8cff', secondary: '#57d7ff', surface: '#0b1224', text: '#e8f0ff', heading: 'display-sans', body: 'sans-serif', radius: 'medium', motion: 'cinematic' },
    featureConfig: sharedFeatures,
    required: ['hero.imageUrl', 'intro.description', 'roles:3', 'locations:3', 'equipment:3', 'closing.title'],
  },
};

export function listGameTemplates() {
  return Object.values(definitions).map(({ id, name, description, thumbnailUrl, theme, featureConfig, required }) => ({ id, name, description, thumbnailUrl, theme, featureConfig, required }));
}

export function getGameTemplate(preset: string): TemplateDefinition {
  const definition = definitions[preset as GameTemplatePreset];
  if (!definition) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'Game template is invalid', 400);
  return definition;
}

export function createPageConfig(preset: GameTemplatePreset, name: string, tagline: string, shortDescription: string): GamePageConfig {
  const cards = ['Thế giới có chiều sâu', 'Trải nghiệm đa nền tảng', 'Cộng đồng đồng hành'].map((title) => ({ title, description: `Khám phá ${title.toLowerCase()} trong ${name}.` }));
  const gallery = [1, 2, 3].map((index) => ({ title: `Khoảnh khắc ${index}`, description: `Một góc nhìn của ${name}.` }));
  const roles = ['Tiên phong', 'Chiến thuật', 'Hỗ trợ'].map((title) => ({ title, description: `Vai trò ${title.toLowerCase()} trong đội hình.` }));
  const locations = ['Khu vực trung tâm', 'Vành đai phía ngoài', 'Vùng dị thường'].map((title) => ({ title, description: `Khám phá ${title.toLowerCase()}.` }));
  const equipment = ['Trang bị chính', 'Phòng thủ', 'Thiết bị chiến thuật'].map((title) => ({ title, description: `Trang bị dành cho ${name}.` }));
  return {
    schemaVersion: 1,
    preset,
    hero: { eyebrow: 'ZENX GO', title: name, description: tagline || shortDescription },
    intro: { eyebrow: 'Về game', title: `Khám phá ${name}`, description: shortDescription },
    featureCards: cards,
    gallery,
    faqs: [],
    roles,
    locations,
    equipment,
    closing: { eyebrow: 'Kết nối cộng đồng', title: `Bước vào ${name}`, description: tagline || shortDescription },
  };
}

export function parseGamePageConfig(value: string, preset: string): GamePageConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, 'Invalid pageConfig', 500);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, 'Invalid pageConfig', 500);
  const config = parsed as Partial<GamePageConfig>;
  if (!isValidPageConfig(config, preset)) {
    throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, 'Invalid pageConfig', 500);
  }
  try { validatePageUrls(config); } catch { throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, 'Invalid pageConfig', 500); }
  return config as GamePageConfig;
}

export function validateGamePageConfig(value: unknown, preset: string): GamePageConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'pageConfig must be an object', 400);
  const config = value as Partial<GamePageConfig>;
  if (!isValidPageConfig(config, preset)) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'pageConfig does not match the game template', 400);
  validatePageUrls(config);
  return config as GamePageConfig;
}

function isValidPageConfig(config: Partial<GamePageConfig>, preset: string): config is GamePageConfig {
  const validTextBlock = (value: unknown): value is { eyebrow: string; title: string; description: string } => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const block = value as Record<string, unknown>;
    return typeof block.eyebrow === 'string' && typeof block.title === 'string' && typeof block.description === 'string';
  };
  const validItem = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const item = value as Record<string, unknown>;
    return typeof item.title === 'string' && (item.description === undefined || typeof item.description === 'string') && (item.imageUrl === undefined || item.imageUrl === null || typeof item.imageUrl === 'string');
  };
  return config.schemaVersion === 1 && config.preset === preset && validTextBlock(config.hero) && validTextBlock(config.intro) && validTextBlock(config.closing) && Array.isArray(config.featureCards) && config.featureCards.every(validItem) && Array.isArray(config.gallery) && config.gallery.every(validItem) && Array.isArray(config.roles) && config.roles.every(validItem) && Array.isArray(config.locations) && config.locations.every(validItem) && Array.isArray(config.equipment) && config.equipment.every(validItem) && Array.isArray(config.faqs) && config.faqs.every((faq) => Boolean(faq) && typeof faq === 'object' && typeof (faq as { question?: unknown }).question === 'string' && typeof (faq as { answer?: unknown }).answer === 'string');
}

function validatePageUrls(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(validatePageUrls);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && (key.endsWith('Url') || key.endsWith('ImageUrl'))) assertAssetUrl(child);
    if (key === 'href' && (typeof child === 'string' || child === null)) assertCtaPath(child);
    validatePageUrls(child);
  }
}

export function validateGameThemeConfig(value: unknown): GameThemeConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'themeConfig must be an object', 400);
  const theme = value as Partial<GameThemeConfig>;
  const required = ['primary', 'secondary', 'surface', 'text', 'heading', 'body', 'radius', 'motion'] as const;
  if (required.some((key) => typeof theme[key] !== 'string' || !(theme[key] as string).trim())) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'themeConfig is incomplete', 400);
  return theme as GameThemeConfig;
}

export function validateGameFeatureConfig(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'featureConfig must be an object', 400);
  const feature = value as Record<string, unknown>;
  const allowedRoutes = ['ABOUT', 'NEWS', 'ROADMAP', 'DOWNLOAD'];
  if (!Array.isArray(feature.sections) || feature.sections.some((item) => typeof item !== 'string')) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'featureConfig sections are invalid', 400);
  if (feature.routes !== undefined && (!Array.isArray(feature.routes) || feature.routes.some((item) => typeof item !== 'string' || !allowedRoutes.includes(item)))) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'featureConfig routes are invalid', 400);
  return feature;
}

export function checkGameReadiness(game: {
  name: string; tagline: string; shortDescription: string; longDescription: string | null;
  logoUrl: string | null; iconUrl: string | null; coverUrl: string | null; heroDesktopUrl: string | null; heroMobileUrl: string | null;
  primaryCtaLabel: string | null; primaryCtaPath: string | null; themePreset: string; themeConfig: string; featureConfig: string; pageConfig: string;
  articles?: Array<{ status: string }>;
  milestones?: Array<unknown>;
}) {
  const errors: Array<{ field: string; message: string }> = [];
  const definition = getGameTemplate(game.themePreset);
  if (!game.name.trim()) errors.push({ field: 'name', message: 'Tên game là bắt buộc.' });
  if (!game.tagline.trim()) errors.push({ field: 'tagline', message: 'Tagline là bắt buộc.' });
  if (!game.shortDescription.trim()) errors.push({ field: 'shortDescription', message: 'Mô tả ngắn là bắt buộc.' });
  if (!game.longDescription?.trim()) errors.push({ field: 'longDescription', message: 'Mô tả chi tiết là bắt buộc.' });
  for (const field of ['logoUrl', 'iconUrl', 'coverUrl', 'heroDesktopUrl', 'heroMobileUrl'] as const) if (!game[field]) errors.push({ field, message: 'Media bắt buộc chưa được thiết lập.' });
  if ((game.primaryCtaLabel && !game.primaryCtaPath) || (!game.primaryCtaLabel && game.primaryCtaPath)) errors.push({ field: 'primaryCta', message: 'CTA chính phải có cả nhãn và đường dẫn.' });
  try { parseJsonConfig(game.themeConfig, 'themeConfig'); } catch { errors.push({ field: 'themeConfig', message: 'Theme config không hợp lệ.' }); }
  let featureConfig: Record<string, unknown> = {};
  try { featureConfig = parseJsonConfig(game.featureConfig, 'featureConfig'); } catch { errors.push({ field: 'featureConfig', message: 'Feature config không hợp lệ.' }); }
  let pageConfig: GamePageConfig | null = null;
  try { pageConfig = parseGamePageConfig(game.pageConfig, game.themePreset); } catch { errors.push({ field: 'pageConfig', message: 'Page config không hợp lệ.' }); }
  if (pageConfig) {
    for (const requirement of definition.required) {
      const [path = '', countText] = requirement.split(':');
      const value = path.split('.').reduce<unknown>((current, key) => current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, pageConfig);
      if (countText && Array.isArray(value) && value.length < Number(countText)) errors.push({ field: path, message: `Cần ít nhất ${countText} mục.` });
      else if (!countText && (!value || (typeof value === 'string' && !value.trim()))) errors.push({ field: path, message: 'Trường bắt buộc chưa được nhập.' });
    }
  }
  if (Array.isArray(featureConfig.sections) && featureConfig.sections.includes('ARTICLE_GRID') && !(game.articles ?? []).some((article) => article.status === 'PUBLISHED')) errors.push({ field: 'articles', message: 'Section tin tức đang bật nhưng chưa có bài viết đã publish.' });
  if (Array.isArray(featureConfig.sections) && featureConfig.sections.includes('ROADMAP_PREVIEW') && !(game.milestones ?? []).length) errors.push({ field: 'milestones', message: 'Section roadmap đang bật nhưng chưa có milestone.' });
  return { ready: errors.length === 0, errors, warnings: [] };
}

function parseJsonConfig(value: string, field: string) {
  try { const parsed = JSON.parse(value); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); return parsed as Record<string, unknown>; } catch { throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, `Invalid ${field}`, 500); }
}
