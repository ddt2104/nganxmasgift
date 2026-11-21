import * as THREE from 'three';
import type { MemoryItem, VoucherStatus } from '../data/memories';

/**
 * Tạo texture vân gỗ óc chó sẫm cho đế quả cầu tuyết
 */
export function createWoodBaseTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  ctx.fillStyle = '#2a1612';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const wave = Math.sin(y * 0.06) * 8 + Math.sin(y * 0.23) * 3;
    const tone = 24 + Math.sin((y + wave) * 0.14) * 10 + (Math.random() - 0.5) * 5;
    ctx.fillStyle = `rgb(${Math.round(tone * 1.55)}, ${Math.round(tone * 0.78)}, ${Math.round(tone * 0.58)})`;
    ctx.fillRect(0, y, size, 1);
  }

  // Thêm các thớ gỗ tinh tế
  ctx.strokeStyle = 'rgba(18, 7, 5, 0.28)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 42; i++) {
    const baseY = (i / 42) * size;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 16) {
      const y = baseY + Math.sin(x * 0.02 + i) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#525252';
  rCtx.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * size;
    const v = Math.floor(60 + Math.random() * 65);
    rCtx.fillStyle = `rgb(${v},${v},${v})`;
    rCtx.fillRect(0, y, size, 2);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap };
}

/**
 * Tạo bảng đồng khắc chữ "NGAN'S XMAS GIFT" gắn phía trước đế cầu tuyết
 */
export function createBrassPlaqueTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#c89d3c');
  grad.addColorStop(0.35, '#f6db7b');
  grad.addColorStop(0.55, '#d4a644');
  grad.addColorStop(1, '#9e7623');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Vệt xước kim loại mảnh
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 65; i++) {
    const y = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Viền khung đôi cổ điển
  ctx.strokeStyle = '#4a3208';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(17, 17, w - 34, h - 34);

  // Chữ khắc trên bảng đồng
  ctx.fillStyle = '#332004';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 32px Georgia, serif';
  ctx.fillText("NGAN'S XMAS GIFT", w / 2, h / 2 - 14, w - 56);

  ctx.font = '500 17px sans-serif';
  ctx.fillStyle = '#4e3309';
  ctx.fillText('GIÁNG SINH AN LÀNH · CHỈ DÀNH CHO EM', w / 2, h / 2 + 25);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Tạo texture bề mặt tuyết lấp lánh bên trong quả cầu
 */
export function createSnowGroundTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#f7faff');
  grad.addColorStop(0.75, '#e8eef8');
  grad.addColorStop(1, '#cfd9ea');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.7 + Math.random() * 2.2;
    const alpha = 0.15 + Math.random() * 0.45;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const bv = Math.floor(110 + Math.random() * 90);
    bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 1.4, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

/**
 * Sprite hạt tuyết mềm phát sáng nhẹ (dùng cho hàng ngàn hạt tuyết rơi)
 */
export function createSnowflakeSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, 'rgba(240, 248, 255, 0.85)');
  grad.addColorStop(0.7, 'rgba(220, 235, 255, 0.25)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Bóng tiếp xúc (Contact Shadow) mềm bên dưới đế quả cầu tuyết
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 16, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(2, 4, 10, 0.82)');
  grad.addColorStop(0.5, 'rgba(3, 6, 14, 0.42)');
  grad.addColorStop(1, 'rgba(9, 13, 22, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Tạo texture khung ảnh Polaroid có viền giấy ấm, ngày kỷ niệm & ảnh thật (hoặc gradient dự phòng)
 */
export function createPolaroidTexture(
  memory: MemoryItem,
  maxAnisotropy: number,
  voucherStatus: VoucherStatus,
  hasSecretWish = false
): THREE.CanvasTexture {
  const w = 384;
  const h = 468;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  const isHighlighted = voucherStatus !== 'available';

  const drawFrame = (img?: HTMLImageElement) => {
    // Nền giấy Polaroid màu kem ngà ấm
    ctx.fillStyle = '#f8f5ec';
    ctx.fillRect(0, 0, w, h);

    // Viền ánh kim tinh tế
    ctx.strokeStyle = isHighlighted ? '#d4af37' : 'rgba(212, 175, 55, 0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Khung ảnh bên trong (tỷ lệ 4:3)
    const padX = 24;
    const padY = 24;
    const imgW = w - padX * 2;
    const imgH = 376;

    if (img) {
      // Cắt ảnh theo tỉ lệ cover
      const scale = Math.max(imgW / img.width, imgH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = padX + (imgW - drawW) / 2;
      const offsetY = padY + (imgH - drawH) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padX, padY, imgW, imgH);
      ctx.clip();
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // Lớp vignette ấm nhẹ
      const vig = ctx.createRadialGradient(
        w / 2,
        padY + imgH / 2,
        imgW * 0.25,
        w / 2,
        padY + imgH / 2,
        imgW * 0.72
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(18,10,8,0.22)');
      ctx.fillStyle = vig;
      ctx.fillRect(padX, padY, imgW, imgH);
      ctx.restore();
    } else {
      // Nền gradient dự phòng lãng mạn khi ảnh đang tải hoặc lỗi URL
      const fallback = ctx.createLinearGradient(padX, padY, padX + imgW, padY + imgH);
      fallback.addColorStop(0, memory.fallbackGradient[0]);
      fallback.addColorStop(1, memory.fallbackGradient[1]);
      ctx.fillStyle = fallback;
      ctx.fillRect(padX, padY, imgW, imgH);

      ctx.fillStyle = 'rgba(255, 215, 0, 0.65)';
      ctx.font = '600 42px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦', w / 2, padY + imgH / 2 + 12);
    }

    // Viền mảnh quanh khung ảnh
    ctx.strokeStyle = 'rgba(40, 25, 18, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padX, padY, imgW, imgH);

    // Giữ tham số tương thích khi trạng thái thay đổi
    void voucherStatus;
    void hasSecretWish;

    tex.needsUpdate = true;
  };

  // Vẽ khung dự phòng ngay lập tức, sau đó cập nhật khi ảnh load xong
  drawFrame();

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.referrerPolicy = 'no-referrer';
  img.onload = () => drawFrame(img);
  img.src = memory.imageUrl;

  return tex;
}
