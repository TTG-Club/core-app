<script setup lang="ts">
  import type {
    AdminOnlineHistoryMetric,
    AdminOnlineHistoryPoint,
  } from '../model';

  import {
    ADMIN_ONLINE_HISTORY_CHART_ACTIVE_POINT_RADIUS,
    ADMIN_ONLINE_HISTORY_CHART_AREA_OPACITY,
    ADMIN_ONLINE_HISTORY_CHART_CURSOR_DASH,
    ADMIN_ONLINE_HISTORY_CHART_CURSOR_OPACITY,
    ADMIN_ONLINE_HISTORY_CHART_GRID_LINES,
    ADMIN_ONLINE_HISTORY_CHART_GRID_OPACITY,
    ADMIN_ONLINE_HISTORY_CHART_HALO_RADIUS,
    ADMIN_ONLINE_HISTORY_CHART_HEIGHT,
    ADMIN_ONLINE_HISTORY_CHART_LABEL,
    ADMIN_ONLINE_HISTORY_CHART_LABEL_BASELINE,
    ADMIN_ONLINE_HISTORY_CHART_LABEL_GAP,
    ADMIN_ONLINE_HISTORY_CHART_LINE_WIDTH,
    ADMIN_ONLINE_HISTORY_CHART_PADDING,
    ADMIN_ONLINE_HISTORY_CHART_POINT_RADIUS,
    ADMIN_ONLINE_HISTORY_CHART_POINTS_MAX_DAYS,
    ADMIN_ONLINE_HISTORY_CHART_TOOLTIP_OFFSET,
    ADMIN_ONLINE_HISTORY_GUESTS_LABEL,
    ADMIN_ONLINE_HISTORY_PEAK_TIME_LABEL,
    ADMIN_ONLINE_HISTORY_REGISTERED_LABEL,
    formatHistoryAxisDate,
    formatHistoryPeakTime,
    formatHistoryTooltipDate,
    formatHistoryValue,
    getHistoryAxisLabelAnchor,
    getHistoryAxisLabelStep,
    getHistoryScaleMaximum,
  } from '../model';

  /** Точка графика уже в пикселях. */
  interface PlottedPoint {
    pointX: number;
    pointY: number | null;
  }

  /** Строка подсказки над точкой: подпись и значение. */
  interface TooltipRow {
    label: string;
    value: string;
  }

  const props = defineProps<{
    /** Подпись показателя: заголовок строки в подсказке */
    label: string;
    metric: AdminOnlineHistoryMetric;
    points: ReadonlyArray<AdminOnlineHistoryPoint>;
  }>();

  const wrapperRef = useTemplateRef<HTMLDivElement>('wrapper');

  // Ширина нужна в пикселях: сетка, подписи и точки считаются в них, а не
  // растягиваются вместе с viewBox — иначе текст и линии плющило бы.
  const { width: chartWidth } = useElementSize(wrapperRef);

  const hoveredIndex = ref<number | null>(null);

  const plotWidth = computed(() =>
    Math.max(
      chartWidth.value
        - ADMIN_ONLINE_HISTORY_CHART_PADDING.left
        - ADMIN_ONLINE_HISTORY_CHART_PADDING.right,
      0,
    ),
  );

  const plotHeight =
    ADMIN_ONLINE_HISTORY_CHART_HEIGHT
    - ADMIN_ONLINE_HISTORY_CHART_PADDING.top
    - ADMIN_ONLINE_HISTORY_CHART_PADDING.bottom;

  const plotBottom = ADMIN_ONLINE_HISTORY_CHART_PADDING.top + plotHeight;

  const gridLabelX =
    ADMIN_ONLINE_HISTORY_CHART_PADDING.left
    - ADMIN_ONLINE_HISTORY_CHART_LABEL_GAP;

  const axisLabelY =
    ADMIN_ONLINE_HISTORY_CHART_HEIGHT
    - ADMIN_ONLINE_HISTORY_CHART_LABEL_BASELINE;

  const scaleMaximum = computed(() =>
    getHistoryScaleMaximum(
      Math.max(0, ...props.points.map(({ value }) => value ?? 0)),
      props.metric,
    ),
  );

  /** Шаг между соседними сутками; одни сутки стоят посередине. */
  const dayStep = computed(() =>
    props.points.length > 1 ? plotWidth.value / (props.points.length - 1) : 0,
  );

  const plottedPoints = computed<PlottedPoint[]>(() =>
    props.points.map(({ value }, index) => ({
      pointX:
        ADMIN_ONLINE_HISTORY_CHART_PADDING.left
        + (props.points.length > 1
          ? index * dayStep.value
          : plotWidth.value / 2),
      pointY:
        value === null
          ? null
          : plotBottom - (plotHeight * value) / scaleMaximum.value,
    })),
  );

  /**
   * Куски линии между разрывами: сутки без данных рвут линию, а не роняют её в ноль.
   */
  const segments = computed(() =>
    plottedPoints.value
      .reduce<Array<Array<{ pointX: number; pointY: number }>>>(
        (result, { pointX, pointY }) => {
          if (pointY === null) {
            result.push([]);

            return result;
          }

          result.at(-1)?.push({ pointX, pointY });

          return result;
        },
        [[]],
      )
      .filter((segment) => segment.length),
  );

  const linePaths = computed(() =>
    segments.value.map((segment) =>
      segment
        .map(
          ({ pointX, pointY }, index) =>
            `${index ? 'L' : 'M'}${pointX},${pointY}`,
        )
        .join(' '),
    ),
  );

  const areaPaths = computed(() =>
    segments.value.map((segment) => {
      const first = segment[0];
      const last = segment.at(-1);

      if (!first || !last) {
        return '';
      }

      const line = segment
        .map(({ pointX, pointY }) => `L${pointX},${pointY}`)
        .join(' ');

      return `M${first.pointX},${plotBottom} ${line} L${last.pointX},${plotBottom} Z`;
    }),
  );

  /**
   * Точки на каждых сутках — пока их немного. Одинокие сутки между разрывами
   * рисуются точкой всегда: линии у них нет, иначе их не было бы видно вовсе.
   */
  const visibleDots = computed(() => {
    const isShort =
      props.points.length <= ADMIN_ONLINE_HISTORY_CHART_POINTS_MAX_DAYS;

    return segments.value.flatMap((segment) =>
      isShort || segment.length === 1 ? segment : [],
    );
  });

  const gridLines = computed(() =>
    [
      ...Array.from({
        length: ADMIN_ONLINE_HISTORY_CHART_GRID_LINES + 1,
      }).keys(),
    ].map((line) => ({
      label: formatHistoryValue(
        (scaleMaximum.value * line) / ADMIN_ONLINE_HISTORY_CHART_GRID_LINES,
        props.metric,
      ),
      lineY:
        plotBottom
        - (plotHeight * line) / ADMIN_ONLINE_HISTORY_CHART_GRID_LINES,
    })),
  );

  const axisLabels = computed(() => {
    const step = getHistoryAxisLabelStep(props.points.length, plotWidth.value);
    const lastIndex = props.points.length - 1;

    // Подписи отсчитываем от последних суток: «сегодня» подписано всегда.
    return plottedPoints.value
      .map(({ pointX }, index) => ({ index, pointX }))
      .filter(({ index }) => (lastIndex - index) % step === 0)
      .map(({ index, pointX }) => ({
        anchor: getHistoryAxisLabelAnchor(index, lastIndex),
        label: formatHistoryAxisDate(props.points[index]?.day.date ?? ''),
        pointX,
      }));
  });

  const hoveredPlottedPoint = computed(() =>
    hoveredIndex.value === null
      ? null
      : (plottedPoints.value[hoveredIndex.value] ?? null),
  );

  // Точка под указателем рисуется, только если у суток есть значение.
  const hoveredDot = computed(() => {
    const plottedPoint = hoveredPlottedPoint.value;

    return plottedPoint && plottedPoint.pointY !== null
      ? { pointX: plottedPoint.pointX, pointY: plottedPoint.pointY }
      : null;
  });

  const hoveredPoint = computed(() =>
    hoveredIndex.value === null
      ? null
      : (props.points[hoveredIndex.value] ?? null),
  );

  const tooltipTitle = computed(() =>
    hoveredPoint.value
      ? formatHistoryTooltipDate(hoveredPoint.value.day.date)
      : '',
  );

  const tooltipRows = computed<TooltipRow[]>(() => {
    const point = hoveredPoint.value;

    if (!point) {
      return [];
    }

    const rows: TooltipRow[] = [
      {
        label: props.label,
        value: formatHistoryValue(point.value, props.metric),
      },
    ];

    if (props.metric === 'visitors' && point.value !== null) {
      rows.push(
        {
          label: ADMIN_ONLINE_HISTORY_GUESTS_LABEL,
          value: formatHistoryValue(point.day.guests, props.metric),
        },
        {
          label: ADMIN_ONLINE_HISTORY_REGISTERED_LABEL,
          value: formatHistoryValue(point.day.registered, props.metric),
        },
      );
    }

    const peakTime = formatHistoryPeakTime(point.day.peakAt);

    if (props.metric === 'peakOnline' && peakTime) {
      rows.push({
        label: ADMIN_ONLINE_HISTORY_PEAK_TIME_LABEL,
        value: peakTime,
      });
    }

    return rows;
  });

  // Подсказка прижимается к точке со стороны, где ей хватает места.
  const tooltipStyle = computed(() => {
    const pointX = hoveredPlottedPoint.value?.pointX ?? 0;
    const isRightHalf = pointX > chartWidth.value / 2;

    return {
      left: `${pointX}px`,
      transform: isRightHalf
        ? `translateX(calc(-100% - ${ADMIN_ONLINE_HISTORY_CHART_TOOLTIP_OFFSET}px))`
        : `translateX(${ADMIN_ONLINE_HISTORY_CHART_TOOLTIP_OFFSET}px)`,
    };
  });

  const chartViewBox = computed(
    () => `0 0 ${chartWidth.value} ${ADMIN_ONLINE_HISTORY_CHART_HEIGHT}`,
  );

  const placeholderStyle = {
    height: `${ADMIN_ONLINE_HISTORY_CHART_HEIGHT}px`,
  };

  const chartAriaLabel = computed(
    () => `${ADMIN_ONLINE_HISTORY_CHART_LABEL}: ${props.label}`,
  );

  /**
   * Находит сутки, ближайшие к указателю по горизонтали.
   */
  function handlePointerMove(event: PointerEvent): void {
    const wrapper = wrapperRef.value;

    if (!wrapper || !props.points.length) {
      return;
    }

    const offsetX =
      event.clientX
      - wrapper.getBoundingClientRect().left
      - ADMIN_ONLINE_HISTORY_CHART_PADDING.left;

    const index = dayStep.value ? Math.round(offsetX / dayStep.value) : 0;

    hoveredIndex.value = Math.min(Math.max(index, 0), props.points.length - 1);
  }

  /** Убирает подсказку, когда указатель ушёл с графика. */
  function handlePointerLeave(): void {
    hoveredIndex.value = null;
  }
</script>

<template>
  <div
    ref="wrapper"
    class="relative touch-pan-y select-none"
    @pointermove="handlePointerMove"
    @pointerdown="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <svg
      v-if="chartWidth"
      :width="chartWidth"
      :height="ADMIN_ONLINE_HISTORY_CHART_HEIGHT"
      :viewBox="chartViewBox"
      class="block"
      role="img"
      :aria-label="chartAriaLabel"
    >
      <g class="text-xs text-dimmed">
        <g
          v-for="gridLine in gridLines"
          :key="gridLine.lineY"
        >
          <line
            :x1="ADMIN_ONLINE_HISTORY_CHART_PADDING.left"
            :x2="chartWidth - ADMIN_ONLINE_HISTORY_CHART_PADDING.right"
            :y1="gridLine.lineY"
            :y2="gridLine.lineY"
            stroke="currentColor"
            :stroke-opacity="ADMIN_ONLINE_HISTORY_CHART_GRID_OPACITY"
            shape-rendering="crispEdges"
          />

          <text
            :x="gridLabelX"
            :y="gridLine.lineY"
            text-anchor="end"
            dominant-baseline="middle"
            fill="currentColor"
            class="tabular-nums"
          >
            {{ gridLine.label }}
          </text>
        </g>

        <text
          v-for="axisLabel in axisLabels"
          :key="axisLabel.pointX"
          :x="axisLabel.pointX"
          :y="axisLabelY"
          :text-anchor="axisLabel.anchor"
          fill="currentColor"
        >
          {{ axisLabel.label }}
        </text>
      </g>

      <line
        v-if="hoveredPlottedPoint"
        :x1="hoveredPlottedPoint.pointX"
        :x2="hoveredPlottedPoint.pointX"
        :y1="ADMIN_ONLINE_HISTORY_CHART_PADDING.top"
        :y2="plotBottom"
        class="text-muted"
        stroke="currentColor"
        :stroke-opacity="ADMIN_ONLINE_HISTORY_CHART_CURSOR_OPACITY"
        :stroke-dasharray="ADMIN_ONLINE_HISTORY_CHART_CURSOR_DASH"
        shape-rendering="crispEdges"
      />

      <g class="text-primary">
        <path
          v-for="areaPath in areaPaths"
          :key="areaPath"
          :d="areaPath"
          fill="currentColor"
          :fill-opacity="ADMIN_ONLINE_HISTORY_CHART_AREA_OPACITY"
        />

        <path
          v-for="linePath in linePaths"
          :key="linePath"
          :d="linePath"
          fill="none"
          stroke="currentColor"
          :stroke-width="ADMIN_ONLINE_HISTORY_CHART_LINE_WIDTH"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <circle
          v-for="dot in visibleDots"
          :key="dot.pointX"
          :cx="dot.pointX"
          :cy="dot.pointY"
          :r="ADMIN_ONLINE_HISTORY_CHART_POINT_RADIUS"
          fill="currentColor"
        />

        <template v-if="hoveredDot">
          <circle
            :cx="hoveredDot.pointX"
            :cy="hoveredDot.pointY"
            :r="ADMIN_ONLINE_HISTORY_CHART_ACTIVE_POINT_RADIUS"
            fill="currentColor"
          />

          <circle
            :cx="hoveredDot.pointX"
            :cy="hoveredDot.pointY"
            :r="ADMIN_ONLINE_HISTORY_CHART_HALO_RADIUS"
            fill="currentColor"
            :fill-opacity="ADMIN_ONLINE_HISTORY_CHART_AREA_OPACITY"
          />
        </template>
      </g>
    </svg>

    <div
      v-else
      :style="placeholderStyle"
    />

    <div
      v-if="hoveredPoint"
      class="pointer-events-none absolute top-1 z-10 min-w-36 rounded-md bg-default px-2.5 py-1.5 text-xs shadow-sm ring ring-default"
      :style="tooltipStyle"
    >
      <p class="mb-1 font-medium text-highlighted">{{ tooltipTitle }}</p>

      <p
        v-for="tooltipRow in tooltipRows"
        :key="tooltipRow.label"
        class="flex justify-between gap-3 text-muted"
      >
        <span>{{ tooltipRow.label }}</span>

        <span class="text-highlighted tabular-nums">{{
          tooltipRow.value
        }}</span>
      </p>
    </div>
  </div>
</template>
