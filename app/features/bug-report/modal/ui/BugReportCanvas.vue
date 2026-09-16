<script setup lang="ts">
  import type { DrawingTool } from '../../model';

  import {
    MAX_SCREENSHOT_EXPORT_SIZE,
    MAX_UNDO_STEPS,
    MODAL_CHROME_WIDTH,
    SCREENSHOT_EXPORT_MIME,
    SCREENSHOT_EXPORT_QUALITY,
  } from '../../model';

  interface StrokePath {
    color: string;
    size: number;
    points: Array<{ x: number; y: number }>;
    tool: DrawingTool;
  }

  /** Рисует один штрих на canvas */
  function drawStroke(context: CanvasRenderingContext2D, stroke: StrokePath) {
    if (stroke.points.length < 2) {
      return;
    }

    const firstPoint = stroke.points[0];
    const lastPoint = stroke.points[stroke.points.length - 1];

    if (!firstPoint || !lastPoint) {
      return;
    }

    context.beginPath();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (stroke.tool === 'rectangle') {
      const width = lastPoint.x - firstPoint.x;
      const height = lastPoint.y - firstPoint.y;

      context.strokeRect(firstPoint.x, firstPoint.y, width, height);
    } else if (stroke.tool === 'circle') {
      const radiusX = Math.abs(lastPoint.x - firstPoint.x);
      const radiusY = Math.abs(lastPoint.y - firstPoint.y);
      const radius = Math.sqrt(radiusX * radiusX + radiusY * radiusY);

      context.arc(firstPoint.x, firstPoint.y, radius, 0, 2 * Math.PI);
      context.stroke();
    } else {
      context.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];

        if (point) {
          context.lineTo(point.x, point.y);
        }
      }

      context.stroke();
    }
  }

  const props = defineProps<{
    /** Скриншот для отображения и рисования */
    screenshotUrl: string;

    /** Текущий цвет кисти */
    brushColor: string;

    /** Текущий размер кисти в пикселях */
    brushSize: number;

    /** Текущий инструмент рисования */
    drawingTool: DrawingTool;
  }>();

  const canvasRef = ref<HTMLCanvasElement>();

  const isDrawing = ref(false);
  const strokes = ref<Array<StrokePath>>([]);
  const currentStroke = ref<StrokePath | null>(null);

  const backgroundImage = ref<HTMLImageElement>();

  /** Размер canvas на экране в CSS-пикселях: вписан в свободное место модалки */
  const displayWidth = ref(0);
  const displayHeight = ref(0);

  /**
   * Сколько пикселей оригинала приходится на один CSS-пиксель холста.
   *
   * Экранный размер canvas ограничен модалкой, а буфер рисования хранит
   * исходное разрешение вставленной картинки — иначе скриншот уезжал бы
   * на сервер уже ужатым до размеров окна репортёра.
   */
  const pixelScale = ref(1);

  /** Ширина буфера рисования: то самое разрешение, в котором уйдёт скриншот */
  const bufferWidth = computed(() =>
    Math.round(displayWidth.value * pixelScale.value),
  );

  /** Высота буфера рисования: то самое разрешение, в котором уйдёт скриншот */
  const bufferHeight = computed(() =>
    Math.round(displayHeight.value * pixelScale.value),
  );

  /** Экранный размер холста: буфер крупнее, на странице canvas занимает столько */
  const canvasStyle = computed(() => ({
    width: `${displayWidth.value}px`,
    height: `${displayHeight.value}px`,
  }));

  /** Смещение изображения относительно canvas (для центрирования маленьких картинок) */
  const imageOffsetX = ref(0);
  const imageOffsetY = ref(0);

  /** Размер изображения на canvas (может отличаться от размера canvas для маленьких картинок) */
  const imageDrawWidth = ref(0);
  const imageDrawHeight = ref(0);

  /** Загружает изображение скриншота и вычисляет размер canvas по картинке */
  function loadBackgroundImage() {
    const image = new Image();

    image.onload = () => {
      backgroundImage.value = image;

      const maxWidth = Math.floor(window.innerWidth * 0.9 - MODAL_CHROME_WIDTH);
      const maxHeight = Math.floor(window.innerHeight * 0.7);

      let drawWidth = image.naturalWidth;
      let drawHeight = image.naturalHeight;

      // Ограничиваем по ширине
      if (drawWidth > maxWidth) {
        const scale = maxWidth / drawWidth;

        drawWidth = maxWidth;
        drawHeight = Math.floor(drawHeight * scale);
      }

      // Ограничиваем по высоте
      if (drawHeight > maxHeight) {
        const scale = maxHeight / drawHeight;

        drawHeight = maxHeight;
        drawWidth = Math.floor(drawWidth * scale);
      }

      imageDrawWidth.value = drawWidth;
      imageDrawHeight.value = drawHeight;

      // Canvas не меньше минимального размера, но картинка не растягивается
      displayWidth.value = Math.max(drawWidth, 300);
      displayHeight.value = Math.max(drawHeight, 200);

      // Буфер рисования хранит оригинал: во сколько раз картинку ужали для
      // показа, во столько же раз буфер крупнее экранного размера. Длинная
      // сторона ограничена, чтобы webp не разрастался на 4K-скриншотах.
      const longestSide = Math.max(image.naturalWidth, image.naturalHeight);

      const exportLimit =
        longestSide > MAX_SCREENSHOT_EXPORT_SIZE
          ? MAX_SCREENSHOT_EXPORT_SIZE / longestSide
          : 1;

      pixelScale.value = drawWidth
        ? Math.max(1, (image.naturalWidth * exportLimit) / drawWidth)
        : 1;

      // Смещение для центрирования маленькой картинки
      imageOffsetX.value = Math.floor((displayWidth.value - drawWidth) / 2);
      imageOffsetY.value = Math.floor((displayHeight.value - drawHeight) / 2);

      nextTick(() => redrawCanvas());
    };

    image.src = props.screenshotUrl;
  }

  /** Полностью перерисовывает canvas: фон + все штрихи */
  function redrawCanvas() {
    const canvas = canvasRef.value;
    const context = canvas?.getContext('2d');

    if (!canvas || !context || !backgroundImage.value) {
      return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Дальше рисуем в CSS-координатах: масштаб до размера буфера берёт на себя
    // контекст, поэтому штрихи и толщина кисти пересчитываются сами.
    context.setTransform(pixelScale.value, 0, 0, pixelScale.value, 0, 0);

    // Заливаем область вокруг маленькой картинки нейтральным фоном
    if (imageOffsetX.value > 0 || imageOffsetY.value > 0) {
      const computedColor = getComputedStyle(canvas)
        .getPropertyValue('--ui-bg-elevated')
        .trim();

      context.fillStyle = computedColor || '#1a1a2e';
      context.fillRect(0, 0, displayWidth.value, displayHeight.value);
    }

    // Рисуем изображение по центру в натуральном размере
    context.drawImage(
      backgroundImage.value,
      imageOffsetX.value,
      imageOffsetY.value,
      imageDrawWidth.value,
      imageDrawHeight.value,
    );

    for (const stroke of strokes.value) {
      drawStroke(context, stroke);
    }

    if (currentStroke.value) {
      drawStroke(context, currentStroke.value);
    }
  }

  /** Вычисляет координаты курсора относительно canvas */
  function getCanvasPoint(event: MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.value;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handleMouseDown(event: MouseEvent) {
    isDrawing.value = true;

    const point = getCanvasPoint(event);

    currentStroke.value = {
      color: props.brushColor,
      size: props.brushSize,
      points: [point],
      tool: props.drawingTool,
    };
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDrawing.value || !currentStroke.value) {
      return;
    }

    const point = getCanvasPoint(event);
    const firstPoint = currentStroke.value.points[0];

    if (!firstPoint) {
      return;
    }

    if (currentStroke.value.tool === 'brush') {
      currentStroke.value.points.push(point);
    } else {
      currentStroke.value.points = [firstPoint, point];
    }

    redrawCanvas();
  }

  function handleMouseUp() {
    if (!isDrawing.value || !currentStroke.value) {
      return;
    }

    isDrawing.value = false;

    if (currentStroke.value.points.length >= 2) {
      strokes.value.push(currentStroke.value);

      if (strokes.value.length > MAX_UNDO_STEPS) {
        strokes.value.shift();
      }
    }

    currentStroke.value = null;
    redrawCanvas();
  }

  /** Отменяет последний штрих */
  function undo() {
    if (strokes.value.length === 0) {
      return;
    }

    strokes.value.pop();
    redrawCanvas();
  }

  /**
   * Экспортирует текущее состояние canvas как webp Blob.
   *
   * Отдаёт полный буфер рисования, то есть исходное разрешение картинки, а не
   * её экранный размер. Браузеры без кодировщика webp вернут png — тип файла
   * читается вызывающей стороной из самого blob-а.
   */
  function exportToBlob(): Promise<Blob> {
    const canvas = canvasRef.value;

    if (!canvas) {
      return Promise.reject(new Error('Canvas не инициализирован'));
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Не удалось экспортировать canvas'));
          }
        },
        SCREENSHOT_EXPORT_MIME,
        SCREENSHOT_EXPORT_QUALITY,
      );
    });
  }

  const hasStrokes = computed(() => strokes.value.length > 0);

  onKeyStroke(['z', 'я'], (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      undo();
    }
  });

  onMounted(() => loadBackgroundImage());

  watch(
    () => props.screenshotUrl,
    () => {
      strokes.value = [];
      currentStroke.value = null;
      loadBackgroundImage();
    },
  );

  defineExpose({ exportToBlob, undo, hasStrokes });
</script>

<template>
  <div class="relative w-fit overflow-hidden">
    <canvas
      ref="canvasRef"
      class="block cursor-crosshair"
      :width="bufferWidth"
      :height="bufferHeight"
      :style="canvasStyle"
      @mousedown.left.prevent="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup.left="handleMouseUp"
      @mouseleave="handleMouseUp"
    />
  </div>
</template>
