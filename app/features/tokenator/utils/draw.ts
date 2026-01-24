import type { FrameTint, TransformState } from '../types';

export const CANVAS_SIZE = 512;

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) {
    return Promise.resolve(null);
  }

  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }

  return new Promise((resolve) => {
    const img = new Image();

    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };

    img.onerror = (e) => {
      console.error('Tokenator: Failed to load image', url, e);
      resolve(null);
    };

    img.src = url;
  });
}

function applyTint(
  ctx: CanvasRenderingContext2D,
  size: number,
  tint: FrameTint,
  frameImg: HTMLImageElement,
) {
  if (!tint.enabled) {
    return;
  }

  ctx.save();

  const blendMode = tint.blendMode || 'source-atop';

  ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;

  if (tint.type === 'solid') {
    ctx.fillStyle = tint.colors[0] || '#000000';
    ctx.fillRect(0, 0, size, size);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, size, size);

    gradient.addColorStop(0, tint.colors[0] || '#000000');
    gradient.addColorStop(1, tint.colors[1] || '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  if (blendMode !== 'source-atop' && blendMode !== 'source-in') {
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(frameImg, 0, 0, size, size);
  }

  ctx.restore();
}

export interface DrawTokenParams {
  ctx: CanvasRenderingContext2D;
  backgroundColor: string;
  currentImage: string | null;
  activeFrameUrl: string | null;
  frameTint: FrameTint;
  transform: TransformState;
  clip?: boolean;
  viewSize?: { width: number; height: number };
  tokenSize?: number;
}

export async function drawToken({
  ctx,
  backgroundColor,
  currentImage,
  activeFrameUrl,
  frameTint,
  transform,
  clip = true,
  viewSize = { width: CANVAS_SIZE, height: CANVAS_SIZE },
  tokenSize = CANVAS_SIZE,
}: DrawTokenParams) {
  const imgPromise = currentImage
    ? loadImage(currentImage)
    : Promise.resolve(null);

  const framePromise = activeFrameUrl
    ? loadImage(activeFrameUrl)
    : Promise.resolve(null);

  const [img, frameImg] = await Promise.all([imgPromise, framePromise]);

  const cx = viewSize.width / 2;
  const cy = viewSize.height / 2;

  const scaleFactor = tokenSize / CANVAS_SIZE;
  const basePadding = 45 * scaleFactor; // Padding so frame covers mask edge
  const baseRadius = Math.max(0, tokenSize / 2 - basePadding);
  const maskRadius = baseRadius * (transform.maskScale || 1);

  ctx.clearRect(0, 0, viewSize.width, viewSize.height);

  if (backgroundColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, maskRadius, 0, Math.PI * 2);
    ctx.fillStyle = backgroundColor;
    ctx.fill();
    ctx.restore();
  }

  if (img) {
    ctx.save();

    if (clip) {
      ctx.beginPath();
      ctx.arc(cx, cy, maskRadius, 0, Math.PI * 2);
      ctx.clip();
    }

    const referenceTokenSize = 500;
    const posScale = tokenSize / referenceTokenSize;

    const { position, scale, rotate, flip } = transform;

    ctx.translate(cx + position.x * posScale, cy + position.y * posScale);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale * (flip.x ? -1 : 1), scale * (flip.y ? -1 : 1));

    const aspectRatio = img.width / img.height;

    let drawWidth = tokenSize;
    let drawHeight = tokenSize;

    if (aspectRatio > 1) {
      drawHeight = tokenSize;
      drawWidth = tokenSize * aspectRatio;
    } else {
      drawWidth = tokenSize;
      drawHeight = tokenSize / aspectRatio;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    if (!clip) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.rect(0, 0, viewSize.width, viewSize.height);
      ctx.arc(cx, cy, maskRadius, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.restore();
    }
  }

  if (frameImg) {
    const frameScaleFactor = transform.frameScale || 1.0;
    const frameSize = tokenSize * frameScaleFactor;
    const x = cx - frameSize / 2;
    const y = cy - frameSize / 2;

    if (frameTint.enabled) {
      const offCanvas = document.createElement('canvas');

      offCanvas.width = frameSize;
      offCanvas.height = frameSize;

      const offCtx = offCanvas.getContext('2d');

      if (offCtx) {
        offCtx.drawImage(frameImg, 0, 0, frameSize, frameSize);
        applyTint(offCtx, frameSize, frameTint, frameImg);
        ctx.drawImage(offCanvas, x, y);
      }
    } else {
      ctx.drawImage(frameImg, x, y, frameSize, frameSize);
    }
  }
}
