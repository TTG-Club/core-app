import type { FrameTint, TransformState } from '../types';

export const CANVAS_SIZE = 1024;

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

    // CrossOrigin is needed for external images (S3) to allow canvas export,
    // but can cause issues with local blob URLs or if CORS headers are missing.
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
) {
  if (!tint.enabled) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';

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
  // 1. Preload resources (Cache & Async)
  // We must ensure images are loaded BEFORE clearing the canvas to prevent flickering (double buffering simulation).
  const imgPromise = currentImage
    ? loadImage(currentImage)
    : Promise.resolve(null);

  const framePromise = activeFrameUrl
    ? loadImage(activeFrameUrl)
    : Promise.resolve(null);

  const [img, frameImg] = await Promise.all([imgPromise, framePromise]);

  const cx = viewSize.width / 2;
  const cy = viewSize.height / 2;

  // Scale mask radius based on token size ratio
  const scaleFactor = tokenSize / CANVAS_SIZE;
  const padding = 65 * scaleFactor;
  const maskRadius = Math.max(0, tokenSize / 2 - padding);

  // 2. Clear & Draw (Synchronous-like logic)
  // Only clear now that we have resources ready to draw immediately.
  ctx.clearRect(0, 0, viewSize.width, viewSize.height);

  // Draw Background
  if (backgroundColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, maskRadius, 0, Math.PI * 2);
    ctx.fillStyle = backgroundColor;
    ctx.fill();
    ctx.restore();
  }

  // Draw Image
  if (img) {
    ctx.save();

    if (clip) {
      ctx.beginPath();
      ctx.arc(cx, cy, maskRadius, 0, Math.PI * 2);
      ctx.clip();
    }

    // Transforms
    // Position is stored relative to editor tokenSize (500px reference)
    // Scale it proportionally for other tokenSizes (e.g., preview)
    const referenceTokenSize = 500;
    const posScale = tokenSize / referenceTokenSize;

    const { position, scale, rotate, flip } = transform;

    ctx.translate(cx + position.x * posScale, cy + position.y * posScale);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale * (flip.x ? -1 : 1), scale * (flip.y ? -1 : 1));

    const aspectRatio = img.width / img.height;

    let drawWidth = tokenSize;
    let drawHeight = tokenSize;

    // COVER Scaling logic relative to tokenSize
    if (aspectRatio > 1) {
      drawHeight = tokenSize;
      drawWidth = tokenSize * aspectRatio;
    } else {
      drawWidth = tokenSize;
      drawHeight = tokenSize / aspectRatio;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Overlay (Inverse Mask)
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

  // Draw Frame
  if (frameImg) {
    const x = cx - tokenSize / 2;
    const y = cy - tokenSize / 2;

    if (frameTint.enabled) {
      // Offscreen canvas for tinting.
      // Ideally cached too, buttint changes are rare compared to drag.
      const offCanvas = document.createElement('canvas');

      offCanvas.width = tokenSize;
      offCanvas.height = tokenSize;

      const offCtx = offCanvas.getContext('2d');

      if (offCtx) {
        offCtx.drawImage(frameImg, 0, 0, tokenSize, tokenSize);
        applyTint(offCtx, tokenSize, frameTint);
        ctx.drawImage(offCanvas, x, y);
      }
    } else {
      ctx.drawImage(frameImg, x, y, tokenSize, tokenSize);
    }
  }
}
