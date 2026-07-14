<script setup lang="ts">
  import { clamp } from 'es-toolkit';

  import ParticipantStatTile from './ParticipantStatTile.vue';

  const {
    current = undefined,
    max = 0,
    disabled = false,
    isPlayer = false,
  } = defineProps<{
    /** Текущие хиты (нет записи — существо на полных, игрок — не задано). */
    current?: number;
    /** Максимум хитов из статблока (`0` — неизвестен / игрок). */
    max?: number;
    disabled?: boolean;
    /** Участник является игроком (всегда имеет интерактивные хиты). */
    isPlayer?: boolean;
  }>();

  const emit = defineEmits<{
    change: [value: number];
  }>();

  /** Быстрые шаги урона/лечения в попапе. */
  const QUICK_STEPS = [-5, -1, 1, 5];

  /** Позиция живого значения — между уроном и лечением. */
  const QUICK_VALUE_INDEX = QUICK_STEPS.length / 2;

  const isOpen = ref(false);

  const isKnown = computed(() => max > 0);

  const isInteractive = computed(() => isKnown.value || isPlayer);

  const currentValue = computed(() => {
    if (isKnown.value) {
      return current ?? max;
    }

    return current ?? 0;
  });

  const display = computed(() => {
    if (isKnown.value) {
      return `${currentValue.value}/${max}`;
    }

    return current !== undefined ? String(current) : '—';
  });

  // Остаток окрашивает значение существ: ноль — error, половина и меньше — warning.
  // Для игроков окрашиваем в error только при достижении 0.
  const valueClass = computed(() => {
    if (currentValue.value <= 0 && (isKnown.value || current !== undefined)) {
      return 'text-error';
    }

    if (isKnown.value && currentValue.value * 2 <= max) {
      return 'text-warning';
    }

    return '';
  });

  const draft = ref(0);

  // Черновик точного значения следует за актуальными хитами, пока попап
  // открыт: быстрые шаги меняют хиты тут же, и устаревший черновик по «ОК»
  // молча откатил бы их.
  watch([() => isOpen.value, currentValue], ([open, value]) => {
    if (open) {
      draft.value = value;
    }
  });

  /**
   * Быстрый шаг урона/лечения — применяется сразу, попап остаётся открытым.
   * @param delta Смещение хитов (отрицательное — урон).
   */
  function applyStep(delta: number): void {
    if (isKnown.value) {
      emit('change', clamp(currentValue.value + delta, 0, max));
    } else {
      emit('change', Math.max(0, currentValue.value + delta));
    }
  }

  /**
   * Подпись быстрого шага со знаком: `-5`, `+1`.
   * @param delta Смещение хитов.
   */
  function stepLabel(delta: number): string {
    return delta > 0 ? `+${delta}` : String(delta);
  }

  function applyDraft(): void {
    isOpen.value = false;

    const clamped = isKnown.value
      ? clamp(draft.value, 0, max)
      : Math.max(0, draft.value);

    if (clamped !== currentValue.value) {
      emit('change', clamped);
    }
  }

  function restoreFull(): void {
    isOpen.value = false;

    if (isKnown.value && currentValue.value !== max) {
      emit('change', max);
    }
  }
</script>

<template>
  <div class="w-full">
    <UPopover
      v-if="isInteractive"
      v-model:open="isOpen"
      class="w-full"
    >
      <!-- Триггер — плитка хитов: клик открывает попап урона/лечения. -->
      <button
        type="button"
        class="w-full cursor-pointer rounded-lg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        :disabled
        aria-label="Изменить хиты"
      >
        <ParticipantStatTile
          label="Хиты"
          class="w-full transition-colors hover:border-accented"
        >
          <span :class="valueClass">{{ display }}</span>
        </ParticipantStatTile>
      </button>

      <template #content>
        <div class="flex w-64 flex-col gap-3 p-3">
          <!-- Быстрые шаги: урон слева, лечение справа, между ними живое
               значение. Применяются сразу, попап не закрывается — удобно
               «отщёлкивать» урон по ходу боя, особенно с телефона. -->
          <div class="flex items-center justify-center gap-1.5">
            <template
              v-for="(step, index) in QUICK_STEPS"
              :key="step"
            >
              <span
                v-if="index === QUICK_VALUE_INDEX"
                class="min-w-14 text-center font-bold text-highlighted tabular-nums"
              >
                {{ display }}
              </span>

              <UButton
                size="sm"
                :color="step < 0 ? 'error' : 'success'"
                variant="soft"
                :label="stepLabel(step)"
                @click.left.exact.prevent="applyStep(step)"
              />
            </template>
          </div>

          <UButton
            v-if="isKnown"
            icon="tabler:heart-plus"
            color="success"
            variant="soft"
            block
            @click.left.exact.prevent="restoreFull"
          >
            Полные хиты
          </UButton>

          <div class="flex items-center gap-2">
            <span class="shrink-0 text-xs text-secondary">
              Или точное значение
            </span>

            <div class="h-px flex-1 bg-default" />
          </div>

          <div class="flex gap-2">
            <UInputNumber
              v-model="draft"
              :min="0"
              :max="max || undefined"
              class="flex-1"
              aria-label="Текущие хиты"
            />

            <UButton
              color="neutral"
              variant="subtle"
              @click.left.exact.prevent="applyDraft"
            >
              ОК
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>

    <!-- Хиты неизвестны (игрок / детальник ещё грузится) — статичная плитка,
         чтобы колонки строк не расползались. -->
    <ParticipantStatTile
      v-else
      label="Хиты"
      class="w-full"
    >
      —
    </ParticipantStatTile>
  </div>
</template>
