<script setup lang="ts">
  import type { BugCountByStatusResponse, BugReportStatus } from '../../model';

  import {
    BUG_REPORT_STATUS_LABELS,
    BUG_REPORT_STATUSES,
    getBugReportStatusColor,
    MY_BUGS_SUMMARY_ALL_LABEL,
  } from '../../model';

  /** Цвет числа на плитке для каждого цвета статуса. */
  const STATUS_VALUE_CLASS: Record<
    ReturnType<typeof getBugReportStatusColor>,
    string
  > = {
    warning: 'text-warning',
    info: 'text-info',
    success: 'text-success',
    error: 'text-error',
  };

  /** Цвет числа на плитке «Все». */
  const TOTAL_VALUE_CLASS = 'text-highlighted';

  /** Оформление выбранной плитки. */
  const ACTIVE_TILE_CLASS =
    'border-primary bg-primary/10 ring-1 ring-primary/50';

  /** Оформление невыбранной плитки. */
  const TILE_CLASS =
    'border-default bg-elevated/50 hover:border-accented hover:bg-elevated';

  const props = defineProps<{
    /** Количество баг-репортов пользователя в разрезе статусов */
    statusCounts: BugCountByStatusResponse[];

    /** Общее количество репортов пользователя без учёта фильтра */
    totalCount: number;
  }>();

  /** Выбранный статус; `null` — показаны все репорты. */
  const statusFilter = defineModel<BugReportStatus | null>({ required: true });

  /**
   * Плитка «Все» занимает всю ширину узкого экрана: в две колонки пять плиток
   * ложатся как 2 + 2 + 1, и последняя выглядит забытой.
   */
  const TOTAL_TILE_SPAN_CLASS = 'col-span-2 sm:col-span-1';

  /** Плитка сводки: подпись, количество и оформление. */
  interface SummaryTile {
    key: string;
    label: string;
    count: number;
    status: BugReportStatus | null;
    valueClass: string;
    spanClass: string;
    isActive: boolean;
  }

  /**
   * Количество репортов в статусе. Сводка не возвращает статусы без репортов,
   * поэтому отсутствие строки означает ноль.
   *
   * @param status Статус баг-репорта.
   */
  function resolveCount(status: BugReportStatus): number {
    return (
      props.statusCounts.find((statusCount) => statusCount.status === status)
        ?.count ?? 0
    );
  }

  const statusTiles = computed<SummaryTile[]>(() =>
    BUG_REPORT_STATUSES.map((status) => ({
      key: status,
      label: BUG_REPORT_STATUS_LABELS[status],
      count: resolveCount(status),
      status,
      valueClass: STATUS_VALUE_CLASS[getBugReportStatusColor(status)],
      spanClass: '',
      isActive: statusFilter.value === status,
    })),
  );

  const tiles = computed<SummaryTile[]>(() => [
    {
      key: 'all',
      label: MY_BUGS_SUMMARY_ALL_LABEL,
      count: props.totalCount,
      status: null,
      valueClass: TOTAL_VALUE_CLASS,
      spanClass: TOTAL_TILE_SPAN_CLASS,
      isActive: statusFilter.value === null,
    },
    ...statusTiles.value,
  ]);

  /**
   * Переключает фильтр. Повторный клик по активной плитке сбрасывает фильтр —
   * иначе с клавиатуры пришлось бы искать плитку «Все».
   *
   * @param status Статус баг-репорта или `null` для сброса фильтра.
   */
  function selectStatus(status: BugReportStatus | null): void {
    statusFilter.value = statusFilter.value === status ? null : status;
  }

  /**
   * Оформление плитки по её состоянию.
   *
   * @param isActive Выбрана ли плитка.
   */
  function resolveTileClass(isActive: boolean): string {
    return isActive ? ACTIVE_TILE_CLASS : TILE_CLASS;
  }
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
    <button
      v-for="tile in tiles"
      :key="tile.key"
      type="button"
      :aria-pressed="tile.isActive"
      class="flex cursor-pointer flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors"
      :class="[resolveTileClass(tile.isActive), tile.spanClass]"
      @click.left.exact.prevent="selectStatus(tile.status)"
    >
      <span
        class="text-xl leading-tight font-bold tabular-nums"
        :class="tile.valueClass"
      >
        {{ tile.count }}
      </span>

      <span class="text-xs leading-tight text-muted">
        {{ tile.label }}
      </span>
    </button>
  </div>
</template>
