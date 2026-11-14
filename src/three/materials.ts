import * as THREE from 'three';
import type { Card } from '../casino/blackjack';
import { EUROPEAN_WHEEL_ORDER, getPocketColor } from '../casino/roulette';
import { SLOT_THEMES, type SlotSymbol, type SlotThemeId } from '../casino/slots';

export interface MaterialLibrary {
  marbleFloor: THREE.MeshStandardMaterial;
  carpetIsland: THREE.MeshStandardMaterial;
  mahogany: THREE.MeshStandardMaterial;
  espressoLeather: THREE.MeshStandardMaterial;
  brushedBrass: THREE.MeshPhysicalMaterial;
  chrome: THREE.MeshPhysicalMaterial;
  gunmetal: THREE.MeshPhysicalMaterial;
  sandstone: THREE.MeshStandardMaterial;
  emeraldFelt: THREE.MeshStandardMaterial;
  rouletteLayout: THREE.MeshStandardMaterial;
  blackjackLayout: THREE.MeshStandardMaterial;
  pokerLayout: THREE.MeshStandardMaterial;
  rotorDisc: THREE.MeshStandardMaterial;
  slotReels: Record<SlotThemeId, THREE.MeshStandardMaterial>;
  slotMarquees: Record<SlotThemeId, THREE.MeshStandardMaterial>;
  cardBack: THREE.MeshStandardMaterial;
  ivoryBall: THREE.MeshPhysicalMaterial;
  crystalBulb: THREE.MeshStandardMaterial;
  velvetRope: THREE.MeshStandardMaterial;
  velvetTeal: THREE.MeshStandardMaterial;
  wallPanel: THREE.MeshStandardMaterial;
  barMarble: THREE.MeshStandardMaterial;
  amberGlass: THREE.MeshStandardMaterial;
  emeraldGlass: THREE.MeshStandardMaterial;
  rubyGlass: THREE.MeshStandardMaterial;
  palmFoliage: THREE.MeshStandardMaterial;
  cyanNeon: THREE.MeshStandardMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  getCardFaceMaterial: (card: Card) => THREE.MeshStandardMaterial;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function createMarbleTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  const half = 256;
  const colors = ['#121017', '#1d1924'];
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      ctx.fillStyle = colors[(x + y) % 2];
      ctx.fillRect(x * half, y * half, half, half);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.09)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const ox = x * half;
      const oy = y * half;
      ctx.moveTo(ox + 18, oy + 40);
      ctx.bezierCurveTo(ox + 95, oy + 120, ox + 170, oy + 70, ox + 238, oy + 210);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.lineTo(half, 512);
  ctx.moveTo(0, half);
  ctx.lineTo(512, half);
  ctx.stroke();

  return finalizeTexture(canvas, maxAnisotropy, true, 12, 12);
}

function createBarMarbleTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#e7dfd1';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(130, 102, 58, 0.25)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 64 + 12);
    ctx.bezierCurveTo(160, i * 64 + 48, 340, i * 64 - 18, 512, i * 64 + 34);
    ctx.stroke();
  }
  return finalizeTexture(canvas, maxAnisotropy, true, 2, 1);
}

function createFeltNoiseTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6500; i++) {
    const v = 105 + Math.floor(Math.random() * 48);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  return finalizeTexture(canvas, maxAnisotropy, false, 4, 4);
}

function createCarpetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#310b15';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.22)';
  ctx.lineWidth = 3;
  for (let i = -512; i < 1024; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 512, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i + 512, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 480, 480);
  return finalizeTexture(canvas, maxAnisotropy, true, 3, 3);
}

function createRouletteLayoutTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(1024, 512);
  ctx.fillStyle = '#0c4736';
  ctx.fillRect(0, 0, 1024, 512);

  const grad = ctx.createRadialGradient(512, 256, 80, 512, 256, 560);
  grad.addColorStop(0, 'rgba(255,255,255,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  const startX = 110;
  const cellW = 68;
  const cellH = 88;
  const topY = 74;

  ctx.fillStyle = '#156a46';
  ctx.fillRect(42, topY, 68, cellH * 3);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.strokeRect(42, topY, 68, cellH * 3);
  ctx.fillStyle = '#f6f2e9';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0', 76, topY + cellH * 1.5);

  for (let col = 0; col < 12; col++) {
    for (let row = 0; row < 3; row++) {
      const num = col * 3 + (3 - row);
      const x = startX + col * cellW;
      const y = topY + row * cellH;
      const color = getPocketColor(num);

      ctx.fillStyle = color === 'red' ? '#8f1922' : '#141319';
      ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.fillStyle = '#f6f2e9';
      ctx.font = 'bold 28px Georgia, serif';
      ctx.fillText(String(num), x + cellW / 2, y + cellH / 2);
    }
  }

  for (let row = 0; row < 3; row++) {
    const x = startX + 12 * cellW;
    const y = topY + row * cellH;
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(x, y, 64, cellH);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('2:1', x + 32, y + cellH / 2);
  }

  const dozenY = topY + cellH * 3;
  const dozens = ['1st 12', '2nd 12', '3rd 12'];
  for (let i = 0; i < 3; i++) {
    const x = startX + i * (cellW * 4);
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(x, dozenY, cellW * 4, 56);
    ctx.fillStyle = '#f6f2e9';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(dozens[i], x + cellW * 2, dozenY + 28);
  }

  const outsideY = dozenY + 56;
  const outsides = ['1-18', 'EVEN', 'RED', 'BLACK', 'ODD', '19-36'];
  for (let i = 0; i < 6; i++) {
    const x = startX + i * (cellW * 2);
    if (outsides[i] === 'RED') {
      ctx.fillStyle = '#8f1922';
      ctx.fillRect(x + 4, outsideY + 4, cellW * 2 - 8, 52);
    } else if (outsides[i] === 'BLACK') {
      ctx.fillStyle = '#141319';
      ctx.fillRect(x + 4, outsideY + 4, cellW * 2 - 8, 52);
    }
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(x, outsideY, cellW * 2, 60);
    ctx.fillStyle = '#f6f2e9';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(outsides[i], x + cellW, outsideY + 30);
  }

  return finalizeTexture(canvas, maxAnisotropy, true);
}

function createBlackjackLayoutTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(1024, 512);
  ctx.fillStyle = '#0c4736';
  ctx.fillRect(0, 0, 1024, 512);

  const grad = ctx.createRadialGradient(512, 80, 50, 512, 260, 560);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.72)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(512, 40, 320, 0.22 * Math.PI, 0.78 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(512, 40, 265, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('BLACKJACK PAYS 3 TO 2', 512, 225);
  ctx.font = '600 18px sans-serif';
  ctx.fillStyle = 'rgba(246, 242, 233, 0.85)';
  ctx.fillText('DEALER MUST STAND ON ALL 17s', 512, 255);

  const spots = [
    { x: 256, y: 390 },
    { x: 512, y: 418 },
    { x: 768, y: 390 },
  ];
  spots.forEach((s, i) => {
    ctx.strokeStyle = i === 1 ? '#f5d061' : 'rgba(212, 175, 55, 0.65)';
    ctx.lineWidth = i === 1 ? 5 : 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.14)';
    ctx.fill();
  });

  return finalizeTexture(canvas, maxAnisotropy, true);
}

function createPokerLayoutTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(1024, 512);
  ctx.fillStyle = '#0d3b4c';
  ctx.fillRect(0, 0, 1024, 512);

  const grad = ctx.createRadialGradient(512, 256, 60, 512, 256, 520);
  grad.addColorStop(0, 'rgba(255,255,255,0.09)');
  grad.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(512, 256, 440, 195, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText("MONTE CARLO HOLD'EM", 512, 128);

  // 5 Community Card Slots
  for (let i = 0; i < 5; i++) {
    const x = 312 + i * 86;
    ctx.strokeStyle = 'rgba(246, 242, 233, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 206, 68, 98);
  }

  // Ante & Call spots
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(430, 388, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(594, 388, 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f6f2e9';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('ANTE', 430, 393);
  ctx.fillText('CALL', 594, 393);

  return finalizeTexture(canvas, maxAnisotropy, true);
}

function createRotorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(1024, 1024);
  const cx = 512;
  const cy = 512;
  const count = EUROPEAN_WHEEL_ORDER.length;
  const step = (Math.PI * 2) / count;

  ctx.fillStyle = '#1b110d';
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < count; i++) {
    const num = EUROPEAN_WHEEL_ORDER[i];
    const color = getPocketColor(num);
    const a0 = i * step - step / 2 - Math.PI / 2;
    const a1 = a0 + step;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 480, a0, a1);
    ctx.closePath();
    ctx.fillStyle = color === 'green' ? '#137a4b' : color === 'red' ? '#9c1721' : '#141418';
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(i * step);
    ctx.fillStyle = '#f6f2e9';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), 0, -405);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 240, 0, Math.PI * 2);
  ctx.fillStyle = '#3b1c12';
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.stroke();

  return finalizeTexture(canvas, maxAnisotropy, true);
}

function drawSlotSymbol(
  ctx: CanvasRenderingContext2D,
  symbol: SlotSymbol,
  cx: number,
  cy: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  switch (symbol) {
    case 'SEVEN':
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 6;
      ctx.font = 'bold 92px Georgia, serif';
      ctx.strokeText('7', 0, 4);
      ctx.fillText('7', 0, 4);
      break;
    case 'BELL':
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -8, 30, Math.PI, 0);
      ctx.lineTo(36, 26);
      ctx.lineTo(-36, 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, 32, 9, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'BAR':
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-46, -24, 92, 48);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(-46, -24, 92, 48);
      ctx.fillStyle = '#f6f2e9';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('BAR', 0, 2);
      break;
    case 'MELON':
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, 4, 34, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 4, 26, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      break;
    case 'LEMON':
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 24, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'CHERRY':
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-18, 12);
      ctx.quadraticCurveTo(0, -32, 10, -34);
      ctx.quadraticCurveTo(18, -10, 20, 14);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(-20, 18, 17, 0, Math.PI * 2);
      ctx.arc(20, 20, 17, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'PHARAOH':
      ctx.fillStyle = '#d4af37';
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(36, 12);
      ctx.lineTo(20, 38);
      ctx.lineTo(-20, 38);
      ctx.lineTo(-36, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-16, -6, 32, 10);
      break;
    case 'SCARAB':
      ctx.fillStyle = '#0ea5e9';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'ANUBIS':
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-22, -36);
      ctx.lineTo(-10, -8);
      ctx.lineTo(10, -8);
      ctx.lineTo(22, -36);
      ctx.lineTo(28, 28);
      ctx.lineTo(0, 40);
      ctx.lineTo(-28, 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'CHALICE':
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-28, -30);
      ctx.lineTo(28, -30);
      ctx.lineTo(14, 6);
      ctx.lineTo(-14, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(-6, 6, 12, 24);
      ctx.fillRect(-20, 28, 40, 8);
      break;
    case 'RUBY':
      ctx.fillStyle = '#be123c';
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(32, -10);
      ctx.lineTo(20, 32);
      ctx.lineTo(-20, 32);
      ctx.lineTo(-32, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'COIN':
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 34px Georgia, serif';
      ctx.fillText('$', 0, 2);
      break;
    case 'CORE':
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('2X', 0, 2);
      break;
    case 'MECH':
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.fillRect(-30, -28, 60, 56);
      ctx.strokeRect(-30, -28, 60, 56);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-18, -10, 36, 14);
      break;
    case 'PRISM':
      ctx.fillStyle = '#a855f7';
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.lineTo(34, 28);
      ctx.lineTo(-34, 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'CHIP':
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 4;
      ctx.fillRect(-26, -26, 52, 52);
      ctx.strokeRect(-26, -26, 52, 52);
      break;
    case 'BOLT':
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(8, -36);
      ctx.lineTo(-20, 4);
      ctx.lineTo(0, 4);
      ctx.lineTo(-10, 36);
      ctx.lineTo(22, -4);
      ctx.lineTo(2, -4);
      ctx.closePath();
      ctx.fill();
      break;
    case 'STAR':
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 68px sans-serif';
      ctx.fillText('★', 0, 4);
      break;
  }
  ctx.restore();
}

function createThemedSlotReelTexture(
  themeId: SlotThemeId,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const cfg = SLOT_THEMES[themeId];
  const stopW = 128;
  const totalW = cfg.strip.length * stopW;
  const [canvas, ctx] = makeCanvas(totalW, 256);

  const bg =
    themeId === 'classic'
      ? '#f3ead8'
      : themeId === 'treasure'
        ? '#e8d2a6'
        : '#0f172a';
  const border =
    themeId === 'classic'
      ? '#7c2d12'
      : themeId === 'treasure'
        ? '#78350f'
        : '#0284c7';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, totalW, 256);

  cfg.strip.forEach((sym, i) => {
    const x = i * stopW;
    ctx.strokeStyle = border;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 3, 8, stopW - 6, 240);
    ctx.save();
    ctx.translate(x + stopW / 2, 128);
    ctx.rotate(Math.PI / 2);
    drawSlotSymbol(ctx, sym, 0, 0);
    ctx.restore();
  });

  const tex = finalizeTexture(canvas, maxAnisotropy, true);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createThemedMarqueeTexture(
  themeId: SlotThemeId,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 160);
  const palette =
    themeId === 'classic'
      ? { bg: '#2c0b12', stroke: '#d4af37', title: 'ROYAL FRUIT 777', sub: '1 OR 3 PAYLINES · CLASSIC', fg: '#ffd76a' }
      : themeId === 'treasure'
        ? { bg: '#1e160c', stroke: '#eab308', title: "PHARAOH'S VAULT", sub: '3 OR 5 PAYLINES · SCARAB WILD', fg: '#fde047' }
        : { bg: '#091526', stroke: '#38bdf8', title: 'CYBER VAULT X', sub: '5 PAYLINES · 2X WILD CORE', fg: '#67e8f9' };

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = palette.fg;
  ctx.font = 'bold 42px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(palette.title, 256, 64);
  ctx.fillStyle = '#f6f2e9';
  ctx.font = '600 18px sans-serif';
  ctx.fillText(palette.sub, 256, 114);
  return finalizeTexture(canvas, maxAnisotropy, true);
}

function createCardBackTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 360);
  ctx.fillStyle = '#f6f2e9';
  ctx.fillRect(0, 0, 256, 360);
  ctx.fillStyle = '#6f111c';
  ctx.fillRect(14, 14, 228, 332);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 212, 316);
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MC', 128, 180);
  return finalizeTexture(canvas, maxAnisotropy, true);
}

function createCardFaceTexture(card: Card, maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 360);
  ctx.fillStyle = '#fbf8f1';
  ctx.fillRect(0, 0, 256, 360);
  ctx.strokeStyle = '#d8d0be';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 348);

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const color = isRed ? '#b91c1c' : '#18181b';
  const suitGlyph =
    card.suit === 'spades'
      ? '♠'
      : card.suit === 'hearts'
        ? '♥'
        : card.suit === 'diamonds'
          ? '♦'
          : '♣';

  ctx.fillStyle = color;
  ctx.font = 'bold 46px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(card.rank, 22, 54);
  ctx.font = '40px serif';
  ctx.fillText(suitGlyph, 24, 96);

  ctx.font = '112px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(suitGlyph, 128, 184);

  ctx.save();
  ctx.translate(256, 360);
  ctx.rotate(Math.PI);
  ctx.font = 'bold 46px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(card.rank, 22, 54);
  ctx.restore();

  return finalizeTexture(canvas, maxAnisotropy, true);
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMaterialLibrary(renderer: THREE.WebGLRenderer): MaterialLibrary {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];
  const cardFaceCache = new Map<string, THREE.MeshStandardMaterial>();

  const trackTex = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const feltBump = trackTex(createFeltNoiseTexture(maxAniso));
  const marbleTex = trackTex(createMarbleTexture(maxAniso));
  const barMarbleTex = trackTex(createBarMarbleTexture(maxAniso));
  const carpetTex = trackTex(createCarpetTexture(maxAniso));
  const rouletteTex = trackTex(createRouletteLayoutTexture(maxAniso));
  const blackjackTex = trackTex(createBlackjackLayoutTexture(maxAniso));
  const pokerTex = trackTex(createPokerLayoutTexture(maxAniso));
  const rotorTex = trackTex(createRotorTexture(maxAniso));
  const cardBackTex = trackTex(createCardBackTexture(maxAniso));
  const shadowTex = trackTex(createContactShadowTexture());

  const slotReelClassicTex = trackTex(createThemedSlotReelTexture('classic', maxAniso));
  const slotReelTreasureTex = trackTex(createThemedSlotReelTexture('treasure', maxAniso));
  const slotReelFuturisticTex = trackTex(createThemedSlotReelTexture('futuristic', maxAniso));

  const marqueeClassicTex = trackTex(createThemedMarqueeTexture('classic', maxAniso));
  const marqueeTreasureTex = trackTex(createThemedMarqueeTexture('treasure', maxAniso));
  const marqueeFuturisticTex = trackTex(createThemedMarqueeTexture('futuristic', maxAniso));

  const marbleFloor = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: marbleTex, roughness: 0.22, metalness: 0.08 }),
  );
  const barMarble = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: barMarbleTex, roughness: 0.16, metalness: 0.06 }),
  );
  const carpetIsland = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: carpetTex, bumpMap: feltBump, bumpScale: 0.02, roughness: 0.9 }),
  );
  const mahogany = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3b1b12, roughness: 0.34, metalness: 0.05 }),
  );
  const sandstone = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x8f6b3e, roughness: 0.52, metalness: 0.15 }),
  );
  const espressoLeather = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1b1210, roughness: 0.58, metalness: 0.04 }),
  );
  const brushedBrass = trackMat(
    new THREE.MeshPhysicalMaterial({ color: 0xd9b552, metalness: 0.92, roughness: 0.2, anisotropy: 0.75, clearcoat: 0.25 }),
  );
  const chrome = trackMat(
    new THREE.MeshPhysicalMaterial({ color: 0xdce2e8, metalness: 0.95, roughness: 0.14, anisotropy: 0.6 }),
  );
  const gunmetal = trackMat(
    new THREE.MeshPhysicalMaterial({ color: 0x262e3d, metalness: 0.88, roughness: 0.28, clearcoat: 0.4 }),
  );
  const emeraldFelt = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x0d4f3c, bumpMap: feltBump, bumpScale: 0.018, roughness: 0.92 }),
  );
  const rouletteLayout = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: rouletteTex, bumpMap: feltBump, bumpScale: 0.015, roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  );
  const blackjackLayout = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: blackjackTex, bumpMap: feltBump, bumpScale: 0.015, roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  );
  const pokerLayout = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: pokerTex, bumpMap: feltBump, bumpScale: 0.015, roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  );
  const rotorDisc = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: rotorTex, roughness: 0.32, metalness: 0.15 }),
  );

  const slotReels: Record<SlotThemeId, THREE.MeshStandardMaterial> = {
    classic: trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, map: slotReelClassicTex, roughness: 0.38, metalness: 0.04 })),
    treasure: trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, map: slotReelTreasureTex, roughness: 0.36, metalness: 0.08 })),
    futuristic: trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, map: slotReelFuturisticTex, roughness: 0.28, metalness: 0.14, emissive: 0x1e3a5f, emissiveIntensity: 0.25 })),
  };

  const slotMarquees: Record<SlotThemeId, THREE.MeshStandardMaterial> = {
    classic: trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, map: marqueeClassicTex, emissive: 0xffd27d, emissiveMap: marqueeClassicTex, emissiveIntensity: 0.48, roughness: 0.3 })),
    treasure: trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, map: marqueeTreasureTex, emissive: 0xfacc15, emissiveMap: marqueeTreasureTex, emissiveIntensity: 0.5, roughness: 0.3 })),
    futuristic: trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, map: marqueeFuturisticTex, emissive: 0x38bdf8, emissiveMap: marqueeFuturisticTex, emissiveIntensity: 0.6, roughness: 0.25 })),
  };

  const cardBack = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: cardBackTex, roughness: 0.42, metalness: 0.04 }),
  );
  const ivoryBall = trackMat(
    new THREE.MeshPhysicalMaterial({ color: 0xfbf7ee, roughness: 0.12, clearcoat: 1.0, clearcoatRoughness: 0.08 }),
  );
  const crystalBulb = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffc966, emissiveIntensity: 1.35, roughness: 0.2 }),
  );
  const velvetRope = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x7c1220, roughness: 0.88, metalness: 0.02 }),
  );
  const velvetTeal = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x0f3d4c, roughness: 0.86, metalness: 0.02 }),
  );
  const wallPanel = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x16111c, roughness: 0.65, metalness: 0.05 }),
  );
  const amberGlass = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.15, metalness: 0.2, emissive: 0x78350f, emissiveIntensity: 0.35 }),
  );
  const emeraldGlass = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.15, metalness: 0.2, emissive: 0x064e3b, emissiveIntensity: 0.35 }),
  );
  const rubyGlass = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.15, metalness: 0.2, emissive: 0x881337, emissiveIntensity: 0.35 }),
  );
  const palmFoliage = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1a5e3a, roughness: 0.72, metalness: 0.02 }),
  );
  const cyanNeon = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.1, roughness: 0.2 }),
  );
  const contactShadow = trackMat(
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false }),
  );

  const getCardFaceMaterial = (card: Card) => {
    const key = `${card.rank}-${card.suit}`;
    const existing = cardFaceCache.get(key);
    if (existing) return existing;
    const tex = trackTex(createCardFaceTexture(card, maxAniso));
    const mat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.38, metalness: 0.02 }),
    );
    cardFaceCache.set(key, mat);
    return mat;
  };

  return {
    marbleFloor,
    carpetIsland,
    mahogany,
    espressoLeather,
    brushedBrass,
    chrome,
    gunmetal,
    sandstone,
    emeraldFelt,
    rouletteLayout,
    blackjackLayout,
    pokerLayout,
    rotorDisc,
    slotReels,
    slotMarquees,
    cardBack,
    ivoryBall,
    crystalBulb,
    velvetRope,
    velvetTeal,
    wallPanel,
    barMarble,
    amberGlass,
    emeraldGlass,
    rubyGlass,
    palmFoliage,
    cyanNeon,
    contactShadow,
    getCardFaceMaterial,
    dispose: () => {
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
