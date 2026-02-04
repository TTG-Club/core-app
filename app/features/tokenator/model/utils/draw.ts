import type { BackgroundStyle, FrameTint, TransformState } from '../types';

/**
 * Создает путь для многоугольной или круглой маски.
 *
 * @param ctx - Контекст canvas
 * @param cx - Центр X
 * @param cy - Центр Y
 * @param radius - Радиус маски
 * @param sides - Количество сторон (0 = круг, 3+ = многоугольник)
 * @param rotation - Угол поворота в градусах
 * @param counterClockwise - Рисовать против часовой стрелки (для evenodd)
 */
function createMaskPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation: number,
  counterClockwise = false,
) {
  if (sides === 0 || sides > 20) {
    // Круглая маска
    ctx.arc(cx, cy, radius, 0, Math.PI * 2, counterClockwise);
  } else {
    // Многоугольная маска
    const angleStep = (Math.PI * 2) / sides;
    const rotationRad = (rotation * Math.PI) / 180;
    const direction = counterClockwise ? -1 : 1;

    for (let i = 0; i <= sides; i++) {
      const angle = i * angleStep * direction + rotationRad - Math.PI / 2;

      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
  }
}

export interface DrawBrushStrokeParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  prevX?: number;
  prevY?: number;
  size: number;
  mode: 'add' | 'remove';
  color?: string;
}

/**
 * Рисует мазок кистью на canvas.
 * Поддерживает интерполяцию линии между текущей и предыдущей точкой.
 *
 * @param params - Параметры отрисовки
 * @param params.ctx - Контекст canvas
 * @param params.x - Текущая координата X
 * @param params.y - Текущая координата Y
 * @param params.prevX - Предыдущая координата X (для интерполяции)
 * @param params.prevY - Предыдущая координата Y (для интерполяции)
 * @param params.size - Размер кисти (диаметр)
 * @param params.mode - Режим рисования (add/remove)
 * @param params.color - Цвет кисти (по умолчанию 'white')
 */
export function drawBrushStroke({
  ctx,
  x,
  y,
  prevX,
  prevY,
  size,
  mode,
  color = 'white',
}: DrawBrushStrokeParams) {
  ctx.save();
  ctx.beginPath();

  const strokeColor = mode === 'add' ? color : 'black';

  ctx.fillStyle = strokeColor;
  ctx.strokeStyle = strokeColor;

  if (mode === 'remove') {
    ctx.globalCompositeOperation = 'destination-out';
  }

  if (prevX !== undefined && prevY !== undefined) {
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Размер canvas для финального экспорта токена.
 * 512px выбран как оптимальный баланс между качеством изображения
 * и размером файла для использования в виртуальных настольных играх.
 */
export const CANVAS_SIZE = 512;

const imageCache = new Map<string, HTMLImageElement>();

/**
 * Загружает изображение с URL и кэширует его для повторного использования.
 * Автоматически обрабатывает CORS для внешних изображений.
 *
 * @param url - URL изображения или null если загрузка не требуется
 * @returns Promise с загруженным HTMLImageElement или null при ошибке/отсутствии URL
 */
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

/**
 * Применяет цветовую тонировку к рамке токена с поддержкой градиентов и режимов наложения.
 *
 * @param ctx - Контекст canvas для отрисовки
 * @param size - Размер области тонировки
 * @param tint - Настройки тонировки (цвет, тип, режим наложения)
 * @param frameImg - Изображение рамки для маскирования
 */
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

export interface DrawTokenText {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
  fontWeight: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
  arc?: number;
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
  maskImage?: HTMLCanvasElement;
  maskTokenSize?: number;
  halfMask?: boolean;
  customBackground?: string | null;
  backgroundStyle?: BackgroundStyle;
  texts?: DrawTokenText[];
}

/**
 * Основная функция отрисовки токена со всеми трансформациями, эффектами и текстом.
 * Рисует фон, изображение персонажа, рамку, маску и текстовые элементы.
 *
 * @param params - Параметры отрисовки токена
 * @param params.ctx - Контекст canvas для отрисовки
 * @param params.backgroundColor - Цвет фона токена
 * @param params.currentImage - URL изображения персонажа
 * @param params.activeFrameUrl - URL активной рамки
 * @param params.frameTint - Настройки тонировки рамки
 * @param params.transform - Трансформации (масштаб, поворот, позиция)
 * @param params.clip - Обрезать ли изображение по кругу маски
 * @param params.viewSize - Размер области отрисовки
 * @param params.tokenSize - Размер токена в пикселях
 * @param params.maskImage - Canvas с пользовательской маской
 * @param params.maskTokenSize - Размер токена при создании маски
 * @param params.halfMask - Использовать ли верхнюю половину маски
 * @param params.customBackground - URL кастомного фонового изображения
 * @param params.backgroundStyle - Настройки фонового изображения (прозрачность и режим наложения)
 * @param params.texts - Массив текстовых элементов для отрисовки
 */
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
  maskImage,
  maskTokenSize,
  halfMask = false,
  customBackground,
  backgroundStyle,
  texts,
}: DrawTokenParams) {
  const imgPromise = currentImage
    ? loadImage(currentImage)
    : Promise.resolve(null);

  const framePromise = activeFrameUrl
    ? loadImage(activeFrameUrl)
    : Promise.resolve(null);

  const bgPromise = customBackground
    ? loadImage(customBackground)
    : Promise.resolve(null);

  const [img, frameImg, bgImg] = await Promise.all([
    imgPromise,
    framePromise,
    bgPromise,
  ]);

  const cx = viewSize.width / 2;
  const cy = viewSize.height / 2;

  const scaleFactor = tokenSize / CANVAS_SIZE;
  const basePadding = 45 * scaleFactor;
  const baseRadius = Math.max(0, tokenSize / 2 - basePadding);
  const maskRadius = baseRadius * (transform.maskScale || 1);

  const referenceTokenSize = 500;
  const posScale = tokenSize / referenceTokenSize;
  const { position, scale, rotate, flip } = transform;

  ctx.clearRect(0, 0, viewSize.width, viewSize.height);

  const maskSides = transform.maskSides || 0;
  const maskRotate = transform.maskRotate || 0;

  if (backgroundColor) {
    ctx.save();
    ctx.beginPath();
    createMaskPath(ctx, cx, cy, maskRadius, maskSides, maskRotate);
    ctx.fillStyle = backgroundColor;
    ctx.fill();
    ctx.restore();
  }

  if (bgImg) {
    ctx.save();
    ctx.beginPath();
    createMaskPath(ctx, cx, cy, maskRadius, maskSides, maskRotate);
    ctx.clip();

    // Применяем прозрачность и режим наложения
    if (backgroundStyle) {
      ctx.globalAlpha = backgroundStyle.opacity / 100;

      ctx.globalCompositeOperation =
        backgroundStyle.blendMode as GlobalCompositeOperation;
    }

    const bgScale = backgroundStyle?.scale || 1;
    const bgPosition = backgroundStyle?.position || { x: 0, y: 0 };
    const bgRotate = backgroundStyle?.rotate || 0;

    const aspectRatio = bgImg.width / bgImg.height;

    let drawWidth = maskRadius * 2 * bgScale;
    let drawHeight = maskRadius * 2 * bgScale;

    if (aspectRatio > 1) {
      drawHeight = maskRadius * 2 * bgScale;
      drawWidth = drawHeight * aspectRatio;
    } else {
      drawWidth = maskRadius * 2 * bgScale;
      drawHeight = drawWidth / aspectRatio;
    }

    const bgPosScale = tokenSize / referenceTokenSize;

    // Применяем трансформации для фона
    ctx.translate(
      cx + bgPosition.x * bgPosScale,
      cy + bgPosition.y * bgPosScale,
    );

    ctx.rotate((bgRotate * Math.PI) / 180);

    ctx.drawImage(
      bgImg,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight,
    );

    ctx.restore();
  }

  if (img) {
    ctx.save();

    if (clip) {
      ctx.beginPath();
      createMaskPath(ctx, cx, cy, maskRadius, maskSides, maskRotate);
      ctx.clip();
    }

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
      createMaskPath(ctx, cx, cy, maskRadius, maskSides, maskRotate, true);
      ctx.fill('evenodd');
      ctx.restore();
    }
  }

  if (frameImg) {
    const frameScaleFactor = transform.frameScale || 1.0;
    const frameSize = tokenSize * frameScaleFactor;
    const x = -frameSize / 2;
    const y = -frameSize / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((transform.frameRotate || 0) * (Math.PI / 180));

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

    ctx.restore();
  }

  if (img && (maskImage || halfMask)) {
    const tempCanvas = document.createElement('canvas');

    tempCanvas.width = viewSize.width;
    tempCanvas.height = viewSize.height;

    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.save();

      tempCtx.translate(cx + position.x * posScale, cy + position.y * posScale);
      tempCtx.rotate((rotate * Math.PI) / 180);
      tempCtx.scale(scale * (flip.x ? -1 : 1), scale * (flip.y ? -1 : 1));

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

      tempCtx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight,
      );

      tempCtx.restore();

      const combinedMaskCanvas = document.createElement('canvas');

      combinedMaskCanvas.width = viewSize.width;
      combinedMaskCanvas.height = viewSize.height;

      const maskCtx = combinedMaskCanvas.getContext('2d');

      if (maskCtx) {
        if (halfMask) {
          maskCtx.fillStyle = 'white';
          maskCtx.fillRect(0, 0, viewSize.width, viewSize.height / 2);
        }

        if (maskImage) {
          const maskW = maskImage.width || viewSize.width;
          const maskH = maskImage.height || viewSize.height;
          const sourceMin = Math.min(maskW, maskH);
          const targetMin = Math.min(viewSize.width, viewSize.height);

          const calculatedMaskScale = maskTokenSize
            ? tokenSize / maskTokenSize
            : targetMin / sourceMin;

          const sourceCx = maskW / 2;
          const sourceCy = maskH / 2;

          const targetCx = viewSize.width / 2;
          const targetCy = viewSize.height / 2;

          const destW = maskW * calculatedMaskScale;
          const destH = maskH * calculatedMaskScale;

          const destX = targetCx - sourceCx * calculatedMaskScale;
          const destY = targetCy - sourceCy * calculatedMaskScale;

          maskCtx.drawImage(maskImage, destX, destY, destW, destH);
        }

        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(combinedMaskCanvas, 0, 0);

        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  }

  if (texts && texts.length > 0) {
    const textScaleFactor = tokenSize / CANVAS_SIZE;

    ctx.save();

    texts.forEach((text) => {
      ctx.save();

      ctx.translate(
        cx + text.x * textScaleFactor,
        cy + text.y * textScaleFactor,
      );

      ctx.rotate((text.rotation * Math.PI) / 180);

      const scaledFontSize = text.fontSize * textScaleFactor;

      ctx.font = `${text.fontWeight} ${scaledFontSize}px ${text.fontFamily || 'Inter'}`;
      ctx.fillStyle = text.color;
      ctx.textBaseline = 'middle';

      const content = text.content || '';
      const arc = text.arc ?? 0;

      if (Math.abs(arc) > 5) {
        ctx.textAlign = 'center';

        const totalAngle = (arc * Math.PI) / 180;
        const totalWidth = ctx.measureText(content).width;
        const radius = totalWidth / totalAngle;

        ctx.translate(0, radius);
        ctx.rotate(-totalAngle / 2);

        for (let i = 0; i < content.length; i++) {
          const char = content[i] || '';
          const charWidth = ctx.measureText(char).width;
          const charAngle = (charWidth / totalWidth) * totalAngle;

          ctx.rotate(charAngle / 2);
          ctx.fillText(char, 0, -radius);
          ctx.rotate(charAngle / 2);
        }
      } else {
        ctx.textAlign = text.align;
        ctx.fillText(content, 0, 0);
      }

      ctx.restore();
    });

    ctx.restore();
  }
}
