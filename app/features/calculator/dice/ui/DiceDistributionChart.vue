<script setup lang="ts">
  import type { Distribution, Histogram } from '../model';

  import {
    chanceAtLeast,
    CHART_GRID_LINES,
    CHART_HEIGHT,
    CHART_LABEL_FONT_SIZE,
    CHART_MAX_AXIS_LABELS,
    CHART_PADDING,
    formatProbability,
  } from '../model';

  /** Цвета и шрифт гистограммы, считанные из текущей темы. */
  interface ChartColors {
    grid: string;
    text: string;
    highlight: string;
    bar: string;
    critical: string;
    miss: string;
    font: string;
  }

  const { histogram, distribution, rolledValue } = defineProps<{
    histogram: Histogram;
    distribution: Distribution;
    rolledValue: number | null;
  }>();

  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const wrapperRef = useTemplateRef<HTMLDivElement>('wrapper');

  const { pixelRatio } = useDevicePixelRatio();
  const { name: themeName } = useTheme();

  const hoveredBin = ref<number | null>(null);

  const readout = computed(() => {
    const bin = hoveredBin.value;

    if (bin === null) {
      return null;
    }

    const probability = histogram.total[bin];

    if (probability === undefined) {
      return null;
    }

    const from = histogram.min + bin * histogram.binWidth;
    const to = from + histogram.binWidth - 1;
    const range = histogram.binWidth > 1 ? `${from}–${to}` : String(from);
    const cumulative = chanceAtLeast(distribution, from);

    return `${range}: ${formatProbability(probability)} · не меньше: ${formatProbability(cumulative)}`;
  });

  /**
   * Считывает цвета гистограммы из темы, применённой к холсту.
   *
   * @param element - Холст, на котором рисуется гистограмма
   * @returns Цвета в том виде, в каком их понимает canvas
   */
  function readColors(element: HTMLElement): ChartColors {
    const styles = getComputedStyle(element);

    return {
      grid: styles.getPropertyValue('--ui-border').trim(),
      text: styles.getPropertyValue('--ui-text-muted').trim(),
      highlight: styles.getPropertyValue('--ui-text-highlighted').trim(),
      bar: styles.getPropertyValue('--color-primary').trim(),
      critical: styles.getPropertyValue('--color-success').trim(),
      miss: styles.getPropertyValue('--color-error').trim(),
      font: `${CHART_LABEL_FONT_SIZE}px ${styles.fontFamily}`,
    };
  }

  /**
   * Рисует сетку и подписи вероятностей по вертикальной оси.
   *
   * @param context - Контекст рисования
   * @param colors - Цвета темы
   * @param plotWidth - Ширина области построения
   * @param plotHeight - Высота области построения
   */
  function drawGrid(
    context: CanvasRenderingContext2D,
    colors: ChartColors,
    plotWidth: number,
    plotHeight: number,
  ): void {
    context.font = colors.font;
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.lineWidth = 1;

    for (let line = 0; line <= CHART_GRID_LINES; line += 1) {
      const y =
        CHART_PADDING.top + plotHeight - (plotHeight * line) / CHART_GRID_LINES;

      const share = (histogram.maxProbability * line) / CHART_GRID_LINES;

      context.strokeStyle = colors.grid;
      context.beginPath();
      context.moveTo(CHART_PADDING.left, y);
      context.lineTo(CHART_PADDING.left + plotWidth, y);
      context.stroke();

      context.fillStyle = colors.text;

      context.fillText(
        `${(share * 100).toFixed(line ? 1 : 0)}%`,
        CHART_PADDING.left - 6,
        y,
      );
    }
  }

  /**
   * Рисует один столбец, разложенный по исходам проверки:
   * снизу промахи, затем попадания, сверху криты.
   *
   * @param context - Контекст рисования
   * @param colors - Цвета темы
   * @param bin - Номер столбца
   * @param geometry - Размеры столбца и области построения
   * @returns Верхняя граница нарисованного столбца
   */
  function drawStackedBar(
    context: CanvasRenderingContext2D,
    colors: ChartColors,
    bin: number,
    geometry: { x: number; width: number; plotHeight: number },
  ): number {
    const outcomes = histogram.outcomes;

    if (!outcomes) {
      return CHART_PADDING.top + geometry.plotHeight;
    }

    const layers: ReadonlyArray<readonly [number, string, number]> = [
      [outcomes.miss[bin] ?? 0, colors.miss, 0.85],
      [outcomes.normal[bin] ?? 0, colors.bar, 0.9],
      [outcomes.critical[bin] ?? 0, colors.critical, 1],
    ];

    let top = CHART_PADDING.top + geometry.plotHeight;

    for (const [probability, color, alpha] of layers) {
      if (probability <= 0) {
        continue;
      }

      const height =
        (geometry.plotHeight * probability) / histogram.maxProbability;

      context.fillStyle = color;
      context.globalAlpha = alpha;
      context.fillRect(geometry.x, top - height, geometry.width, height);

      top -= height;
    }

    return top;
  }

  /**
   * Рисует подписи значений по горизонтальной оси.
   *
   * @param context - Контекст рисования
   * @param colors - Цвета темы
   * @param binWidthInPixels - Ширина одного столбца в пикселях
   * @param plotHeight - Высота области построения
   */
  function drawAxisLabels(
    context: CanvasRenderingContext2D,
    colors: ChartColors,
    binWidthInPixels: number,
    plotHeight: number,
  ): void {
    context.globalAlpha = 1;
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillStyle = colors.text;

    const step = Math.max(
      1,
      Math.ceil(histogram.binCount / CHART_MAX_AXIS_LABELS),
    );

    for (let bin = 0; bin < histogram.binCount; bin += step) {
      context.fillText(
        String(histogram.min + bin * histogram.binWidth),
        CHART_PADDING.left + bin * binWidthInPixels + binWidthInPixels / 2,
        CHART_PADDING.top + plotHeight + 6,
      );
    }
  }

  /** Перерисовывает гистограмму целиком. */
  function draw(): void {
    const canvas = canvasRef.value;
    const canvasWidth = wrapperRef.value?.clientWidth ?? 0;

    if (!canvas || !canvasWidth || !histogram.maxProbability) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    canvas.width = canvasWidth * pixelRatio.value;
    canvas.height = CHART_HEIGHT * pixelRatio.value;

    context.setTransform(pixelRatio.value, 0, 0, pixelRatio.value, 0, 0);
    context.clearRect(0, 0, canvasWidth, CHART_HEIGHT);

    const colors = readColors(canvas);
    const plotWidth = canvasWidth - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    drawGrid(context, colors, plotWidth, plotHeight);

    const binWidthInPixels = plotWidth / histogram.binCount;

    const gap = binWidthInPixels > 4 ? Math.min(2, binWidthInPixels * 0.2) : 0;

    const barWidth = Math.max(binWidthInPixels - gap, 1);

    const rolledBin =
      rolledValue === null
        ? null
        : Math.floor((rolledValue - histogram.min) / histogram.binWidth);

    for (let bin = 0; bin < histogram.binCount; bin += 1) {
      const x = CHART_PADDING.left + bin * binWidthInPixels + gap / 2;
      const isRolled = rolledBin === bin;

      if (histogram.outcomes) {
        const top = drawStackedBar(context, colors, bin, {
          x,
          width: barWidth,
          plotHeight,
        });

        if (isRolled) {
          context.globalAlpha = 1;
          context.strokeStyle = colors.highlight;
          context.lineWidth = 1;

          context.strokeRect(
            x + 0.5,
            top + 0.5,
            barWidth - 1,
            CHART_PADDING.top + plotHeight - top - 1,
          );
        }

        continue;
      }

      const probability = histogram.total[bin] ?? 0;
      const height = (plotHeight * probability) / histogram.maxProbability;

      context.fillStyle = isRolled ? colors.critical : colors.bar;
      context.globalAlpha = isRolled ? 1 : 0.9;
      context.beginPath();

      context.roundRect(
        x,
        CHART_PADDING.top + plotHeight - height,
        barWidth,
        height,
        Math.min(2, binWidthInPixels / 3),
      );

      context.fill();
    }

    drawAxisLabels(context, colors, binWidthInPixels, plotHeight);
  }

  /**
   * Определяет, над каким столбцом находится указатель.
   *
   * @param event - Событие движения указателя над холстом
   */
  function handlePointerMove(event: PointerEvent): void {
    const canvas = canvasRef.value;

    if (!canvas) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();

    const plotWidth = bounds.width - CHART_PADDING.left - CHART_PADDING.right;

    const bin = Math.floor(
      ((event.clientX - bounds.left - CHART_PADDING.left) * histogram.binCount)
        / plotWidth,
    );

    hoveredBin.value = bin >= 0 && bin < histogram.binCount ? bin : null;
  }

  function handlePointerLeave(): void {
    hoveredBin.value = null;
  }

  // Гистограмма живёт в canvas, поэтому её приходится перерисовывать вручную:
  // при смене данных, плотности пикселей, темы и размера контейнера.
  // Ширина читается прямо из DOM, а не через useElementSize: иначе первая
  // отрисовка ждала бы обратный вызов ResizeObserver.
  watch(
    [() => histogram, () => rolledValue, pixelRatio, themeName],
    () => nextTick(draw),
    { immediate: true },
  );

  useResizeObserver(wrapperRef, () => draw());
</script>

<template>
  <div
    ref="wrapper"
    class="relative"
  >
    <canvas
      ref="canvas"
      class="block w-full"
      :style="{ height: `${CHART_HEIGHT}px` }"
      @pointermove="handlePointerMove"
      @pointerleave="handlePointerLeave"
    />

    <p
      v-if="readout"
      class="pointer-events-none absolute top-1 right-1 rounded-md bg-elevated px-2 py-0.5 text-xs text-muted ring ring-default"
    >
      {{ readout }}
    </p>
  </div>
</template>
