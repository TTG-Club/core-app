<script setup lang="ts">
  import type { HitDiceSelectPool } from '../../model';

  import { clamp } from 'es-toolkit';

  /** Строка выбора костей хитов одного номинала. */
  interface HitDiceSelectRow extends HitDiceSelectPool {
    /** Сколько костей номинала выбрано. */
    selected: number;

    /** Класс числа выбранных костей: ноль показывается приглушённым. */
    selectedClass: string;

    /** Подпись кнопки «−» для скринридера. */
    removeAriaLabel: string;

    /** Подпись кнопки «+» для скринридера. */
    addAriaLabel: string;

    isMinusDisabled: boolean;
    isPlusDisabled: boolean;
  }

  // Общий блок выбора костей хитов для обоих отдыхов: короткий тратит кости
  // (предел — остаток), продолжительный возвращает (предел — нехватка до
  // максимума и общее ограничение по правилам).
  const {
    pools,
    totalLimit = Number.POSITIVE_INFINITY,
    addLabel,
    removeLabel,
  } = defineProps<{
    /** Пулы костей хитов по номиналам с пределом выбора. */
    pools: HitDiceSelectPool[];

    /** Ограничение суммы выбранных костей по всем номиналам. */
    totalLimit?: number;

    /** Подпись кнопки «+» для скринридера; к ней добавляется номинал. */
    addLabel: string;

    /** Подпись кнопки «−» для скринридера; к ней добавляется номинал. */
    removeLabel: string;
  }>();

  /** Выбранное количество костей по номиналу. */
  const counts = defineModel<Record<number, number>>({ required: true });

  /**
   * Выбор по пулу, обрезанный его пределом: остаток костей и нехватка до
   * максимума меняются после каждого применения, а выбор в модели остаётся.
   *
   * @param pool пул костей номинала.
   * @returns количество выбранных костей номинала.
   */
  function getSelected(pool: HitDiceSelectPool): number {
    return Math.min(counts.value[pool.die] ?? 0, pool.limit);
  }

  const selectedTotal = computed(() =>
    pools.reduce((total, pool) => total + getSelected(pool), 0),
  );

  const isTotalReached = computed(() => selectedTotal.value >= totalLimit);

  const rows = computed<HitDiceSelectRow[]>(() =>
    pools.map((pool) => {
      const selected = getSelected(pool);

      return {
        ...pool,
        selected,
        selectedClass: selected > 0 ? 'text-warning' : 'text-dimmed',
        removeAriaLabel: `${removeLabel} ${pool.label}`,
        addAriaLabel: `${addLabel} ${pool.label}`,
        isMinusDisabled: selected <= 0,
        isPlusDisabled: selected >= pool.limit || isTotalReached.value,
      };
    }),
  );

  /**
   * Изменение количества костей номинала: значение ограничивается пределом
   * пула, а прирост — ещё и остатком общего ограничения.
   *
   * @param row строка выбора костей номинала.
   * @param delta смещение количества.
   */
  function handleAdjust(row: HitDiceSelectRow, delta: number): void {
    const limit = Math.min(
      row.limit,
      row.selected + Math.max(0, totalLimit - selectedTotal.value),
    );

    counts.value = {
      ...counts.value,
      [row.die]: clamp(row.selected + delta, 0, limit),
    };
  }
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div
      v-for="row in rows"
      :key="row.die"
      class="flex items-center gap-2 rounded bg-default/30 px-2 py-1.5"
    >
      <span class="w-9 shrink-0 text-sm font-bold text-highlighted">
        {{ row.label }}
      </span>

      <span class="text-xs text-muted">
        <span class="font-bold text-highlighted">{{ row.current }}</span>
        / {{ row.max }}
      </span>

      <div class="ml-auto flex items-center gap-1">
        <UButton
          icon="tabler:minus"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :disabled="row.isMinusDisabled"
          :aria-label="row.removeAriaLabel"
          @click.left.exact.prevent="handleAdjust(row, -1)"
        />

        <span
          class="w-6 text-center text-sm font-bold tabular-nums"
          :class="row.selectedClass"
        >
          {{ row.selected }}
        </span>

        <UButton
          icon="tabler:plus"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :disabled="row.isPlusDisabled"
          :aria-label="row.addAriaLabel"
          @click.left.exact.prevent="handleAdjust(row, 1)"
        />
      </div>
    </div>
  </div>
</template>
