/**
 * 根据当前场景描述、地点、角色与画风预设，生成高精度木刻与明暗油画风格的动态 SVG 场景图版。
 * 用于回合加载时的即时呈现，以及在未配置付费图像密钥时作为无损兜底插画。
 */
export function buildDynamicSceneSvgDataUri(params: {
  locationName: string;
  timeOfDay: string;
  scenePrompt: string;
  artStyleId: string;
  characterNames: string[];
  turnNumber: number;
}): string {
  const { locationName, timeOfDay, scenePrompt, artStyleId, characterNames, turnNumber } = params;
  const textLower = `${locationName} ${scenePrompt}`.toLowerCase();

  // 根据场景文本生成确定性哈希
  let hash = turnNumber * 137;
  for (let i = 0; i < textLower.length; i++) {
    hash = (hash * 31 + textLower.charCodeAt(i)) % 100000;
  }

  // 根据画风与场景关键词匹配色调
  let skyTop = '#090A0F';
  let skyMid = '#151824';
  let horizonGlow = '#D4A359';
  let primaryInk = '#1A1C26';
  let accentGlow = '#F2C97D';

  if (
    artStyleId === 'clockwork_engraving' ||
    textLower.includes('钟表') ||
    textLower.includes('黄铜') ||
    textLower.includes('齿轮') ||
    textLower.includes('星盘')
  ) {
    skyTop = '#0B0D13';
    skyMid = '#1B1F2E';
    horizonGlow = '#E09F3E';
    accentGlow = '#FFD166';
  } else if (
    artStyleId === 'verdant_codex' ||
    textLower.includes('沼泽') ||
    textLower.includes('修道院') ||
    textLower.includes('森林') ||
    textLower.includes('根')
  ) {
    skyTop = '#07100E';
    skyMid = '#11221F';
    horizonGlow = '#52B788';
    accentGlow = '#95D5B2';
  } else if (
    artStyleId === 'crimson_inquisition' ||
    textLower.includes('血') ||
    textLower.includes('火') ||
    textLower.includes('灰烬')
  ) {
    skyTop = '#12080A';
    skyMid = '#261115';
    horizonGlow = '#E05A47';
    accentGlow = '#F4A261';
  }

  const isClockwork =
    artStyleId === 'clockwork_engraving' ||
    textLower.includes('齿轮') ||
    textLower.includes('星盘') ||
    textLower.includes('钟表') ||
    textLower.includes('钟摆');
  const isMire =
    artStyleId === 'verdant_codex' ||
    textLower.includes('沼') ||
    textLower.includes('水') ||
    textLower.includes('舟') ||
    textLower.includes('修道院');

  const moonX = 960 + ((hash % 240) - 120);
  const moonY = 175 + ((hash % 50) - 25);

  // 生成浮尘与星火粒子
  const particles: string[] = [];
  for (let i = 0; i < 28; i++) {
    const px = ((hash + i * 491) % 1220) + 30;
    const py = ((hash + i * 263) % 460) + 20;
    const r = (i % 3) + 1;
    const op = ((i % 5) + 2) * 0.12;
    particles.push(`<circle cx="${px}" cy="${py}" r="${r}" fill="${accentGlow}" opacity="${op.toFixed(2)}" />`);
  }

  // 建筑剪影（黑曜石堡垒 / 地下星盘钟表 / 沉水哥特修道院）
  const architectureSvg = isClockwork
    ? `
      <g opacity="0.45" stroke="${horizonGlow}" fill="none">
        <circle cx="${moonX}" cy="${moonY + 40}" r="185" stroke-width="2" stroke-dasharray="12 6" />
        <circle cx="${moonX}" cy="${moonY + 40}" r="142" stroke-width="4" />
        <circle cx="${moonX}" cy="${moonY + 40}" r="96" stroke-width="1.5" stroke-dasharray="4 8" />
        <line x1="${moonX - 210}" y1="${moonY + 40}" x2="${moonX + 210}" y2="${moonY + 40}" stroke-width="1.5" />
        <line x1="${moonX}" y1="${moonY - 170}" x2="${moonX}" y2="${moonY + 250}" stroke-width="1.5" />
        <polygon points="${moonX},${moonY - 110} ${moonX + 22},${moonY + 40} ${moonX},${moonY + 190} ${moonX - 22},${moonY + 40}" stroke-width="1.5" />
      </g>
      <path d="M0,720 L0,210 L140,210 L180,480 L480,495 L530,720 Z" fill="#0D0F17" />
      <path d="M1280,720 L1280,140 L1080,180 L1030,490 L760,510 L710,720 Z" fill="#0B0D14" />
    `
    : isMire
    ? `
      <g fill="#0A1110" stroke="${horizonGlow}" stroke-opacity="0.22" stroke-width="1">
        <path d="M80,720 L80,260 Q190,120 300,260 L300,720 L255,720 L255,290 Q190,185 125,290 L125,720 Z" />
        <path d="M880,720 L880,220 Q1010,70 1140,220 L1140,720 L1090,720 L1090,255 Q1010,140 930,255 L930,720 Z" />
      </g>
      <g stroke="${accentGlow}" stroke-opacity="0.3" stroke-width="1.5">
        <line x1="280" y1="610" x2="980" y2="610" stroke-dasharray="28 18" />
        <line x1="340" y1="640" x2="920" y2="640" stroke-dasharray="16 24" />
        <line x1="410" y1="670" x2="860" y2="670" stroke-dasharray="40 20" />
      </g>
    `
    : `
      <polygon points="620,115 675,270 720,270 755,165 795,295 855,220 910,490 540,490 575,245" fill="#12141E" stroke="${horizonGlow}" stroke-opacity="0.25" stroke-width="1" />
      <path d="M655,490 L655,345 Q715,285 775,345 L775,490 Z" fill="${horizonGlow}" fill-opacity="0.18" stroke="${accentGlow}" stroke-opacity="0.45" />
    `;

  const hasCompanion = characterNames.length > 1;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyTop}" />
        <stop offset="58%" stop-color="${skyMid}" />
        <stop offset="100%" stop-color="#090A0E" />
      </linearGradient>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accentGlow}" stop-opacity="0.55" />
        <stop offset="45%" stop-color="${horizonGlow}" stop-opacity="0.22" />
        <stop offset="100%" stop-color="${skyMid}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="lanternLight" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFF3B0" stop-opacity="0.95" />
        <stop offset="30%" stop-color="${horizonGlow}" stop-opacity="0.45" />
        <stop offset="100%" stop-color="${horizonGlow}" stop-opacity="0" />
      </radialGradient>
      <pattern id="woodcutLines" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#FFFFFF" stroke-width="0.6" stroke-opacity="0.035" />
      </pattern>
    </defs>

    <rect width="1280" height="720" fill="url(#skyGrad)" />

    <circle cx="${moonX}" cy="${moonY}" r="260" fill="url(#sunGlow)" />
    <circle cx="${moonX}" cy="${moonY}" r="56" fill="${accentGlow}" fill-opacity="0.85" />
    <circle cx="${moonX - 14}" cy="${moonY - 8}" r="48" fill="${skyTop}" />

    <path d="M0,520 L180,390 L350,455 L560,340 L790,445 L1020,355 L1280,450 L1280,720 L0,720 Z" fill="${primaryInk}" opacity="0.85" />

    ${architectureSvg}

    <path d="M0,560 Q340,490 640,545 T1280,530 L1280,720 L0,720 Z" fill="#0B0C11" />
    <path d="M360,720 Q510,590 695,525 L755,525 Q635,605 560,720 Z" fill="${horizonGlow}" fill-opacity="0.12" />

    <g transform="translate(455, 435)">
      <circle cx="78" cy="68" r="110" fill="url(#lanternLight)" />
      <path d="M18,195 L32,62 Q45,42 56,62 L72,195 Z" fill="#07080C" stroke="${horizonGlow}" stroke-width="1.2" stroke-opacity="0.55" />
      <circle cx="45" cy="42" r="14" fill="#07080C" stroke="${accentGlow}" stroke-width="1.2" stroke-opacity="0.6" />
      <circle cx="51" cy="64" r="3.5" fill="${accentGlow}" />
      <line x1="52" y1="70" x2="78" y2="56" stroke="#07080C" stroke-width="6" stroke-linecap="round" />
      <line x1="78" y1="56" x2="78" y2="66" stroke="${accentGlow}" stroke-width="1.5" />
      <rect x="73" y="65" width="10" height="15" rx="2" fill="#FFF3B0" stroke="${horizonGlow}" stroke-width="1.5" />
    </g>

    ${
      hasCompanion
        ? `
      <g transform="translate(615, 448)">
        <path d="M12,180 L24,58 Q36,44 46,58 L58,180 Z" fill="#090A10" stroke="${horizonGlow}" stroke-width="1" stroke-opacity="0.4" />
        <circle cx="35" cy="39" r="12" fill="#090A10" stroke="${horizonGlow}" stroke-width="1" stroke-opacity="0.45" />
        <line x1="50" y1="25" x2="44" y2="180" stroke="${horizonGlow}" stroke-width="2" stroke-opacity="0.55" />
      </g>
    `
        : ''
    }

    ${particles.join('\n')}

    <rect width="1280" height="720" fill="url(#woodcutLines)" />

    <rect x="16" y="16" width="1248" height="688" fill="none" stroke="${horizonGlow}" stroke-opacity="0.22" stroke-width="1" />
    <rect x="22" y="22" width="1236" height="676" fill="none" stroke="${horizonGlow}" stroke-opacity="0.1" stroke-width="1" />

    <g transform="translate(42, 668)" opacity="0.72">
      <text x="0" y="0" fill="${accentGlow}" font-family="serif" font-size="13" letter-spacing="1.5">
        图版 ${String(turnNumber).padStart(2, '0')} · ${locationName} · ${timeOfDay}
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
