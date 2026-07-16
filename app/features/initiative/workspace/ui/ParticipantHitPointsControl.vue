<script setup lang="ts">
  import { clamp } from 'es-toolkit';

  import { useDiceRoller } from '~dice-roller/composables';

  import ParticipantStatTile from './ParticipantStatTile.vue';

  const {
    current = undefined,
    max = 0,
    formula = '',
    disabled = false,
    isPlayer = false,
  } = defineProps<{
    /** Текущие хиты (нет записи — существо на полных, игрок — не задано). */
    current?: number;
    /** Максимум хитов из статблока (`0` — неизвестен / игрок). */
    max?: number;
    /** Формула броска хитов из статблока (например, `8к8 + 16`). */
    formula?: string;
    disabled?: boolean;
    /** Участник является игроком (всегда имеет интерактивные хиты). */
    isPlayer?: boolean;
  }>();

  const emit = defineEmits<{
    'change': [value: number];
    /** Новый максимум хитов, прокинутый по формуле статблока. */
    'set-max': [value: number];
  }>();

  const { rollValue, validateWithError } = useDiceRoller();

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

  const draft = ref('');

  // Черновик точного значения следует за актуальными хитами, пока попап
  // открыт: быстрые шаги меняют хиты тут же, и устаревший черновик по «ОК»
  // молча откатил бы их.
  watch([() => isOpen.value, currentValue], ([open, value]) => {
    if (open) {
      draft.value = String(value);
    }
  });

  /** Ввод хитов: `58` — установить точное значение, `+7`/`-6` — сдвинуть. */
  const DRAFT_PATTERN = /^([+-])?(\d+)$/;

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

  // Автоселект значения при фокусе поля: новый ввод сразу затирает текущее
  // число. Выделение из обработчика focus браузер схлопывает последующим
  // mouseup, поэтому при фокусе мышью повторяем выделение на первом click.
  let selectOnClick = false;

  /**
   * Выделяет всё содержимое поля ввода — цели события.
   * @param event Событие фокуса или клика по полю.
   */
  function selectDraft(event: Event): void {
    const { target } = event;

    if (target instanceof HTMLInputElement) {
      target.select();
    }
  }

  /**
   * Выделяет значение при фокусе и взводит повтор для клика мышью.
   * @param event Событие фокуса поля.
   */
  function onDraftFocus(event: FocusEvent): void {
    selectOnClick = true;
    selectDraft(event);
  }

  /**
   * Повторяет выделение на первом клике после фокуса (см. `selectOnClick`).
   * @param event Событие клика по полю.
   */
  function onDraftClick(event: MouseEvent): void {
    if (selectOnClick) {
      selectOnClick = false;
      selectDraft(event);
    }
  }

  /**
   * Применяет введённое значение по `DRAFT_PATTERN`: без знака — точные хиты,
   * со знаком — сдвиг от текущих (`+7` — лечение, `-6` — урон). Невалидный
   * ввод закрывает попап без изменений.
   */
  function applyDraft(): void {
    isOpen.value = false;

    const match = DRAFT_PATTERN.exec(draft.value.trim());

    if (!match) {
      return;
    }

    const [, sign, digits] = match;
    const amount = Number(digits);

    const target = sign
      ? currentValue.value + (sign === '-' ? -amount : amount)
      : amount;

    const clamped = isKnown.value ? clamp(target, 0, max) : Math.max(0, target);

    if (clamped !== currentValue.value) {
      emit('change', clamped);
    }
  }

  // Кнопка броска видна, только когда формула статблока распознаётся роллером.
  const isFormulaRollable = computed(
    () => isKnown.value && Boolean(formula) && validateWithError(formula).valid,
  );

  const rollTooltip = computed(() => `Бросить хиты: ${formula}`);

  /**
   * Прокидывает максимум хитов по формуле статблока: новый максимум и текущие
   * хиты устанавливаются в результат броска (минимум 1 — существо живо).
   */
  function rollMaxHitPoints(): void {
    isOpen.value = false;

    emit('set-max', Math.max(1, Math.floor(rollValue(formula))));
  }

  /** Восстанавливает полные хиты (доступно только при известном максимуме). */
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

          <div
            v-if="isKnown"
            class="flex gap-2"
          >
            <UButton
              icon="tabler:heart-plus"
              color="success"
              variant="soft"
              class="flex-1 justify-center"
              @click.left.exact.prevent="restoreFull"
            >
              Полные хиты
            </UButton>

            <!-- Бросок максимума по формуле статблока: новый максимум и
                 текущие хиты равны результату броска. -->
            <UTooltip
              v-if="isFormulaRollable"
              :text="rollTooltip"
            >
              <UButton
                icon="tabler:dice-5"
                color="success"
                variant="soft"
                aria-label="Бросить хиты по формуле статблока"
                @click.left.exact.prevent="rollMaxHitPoints"
              />
            </UTooltip>
          </div>

          <div class="flex items-center gap-2">
            <span class="shrink-0 text-xs text-secondary">
              Точное значение, + или -
            </span>

            <div class="h-px flex-1 bg-default" />
          </div>

          <div class="flex gap-2">
            <UInput
              v-model="draft"
              class="flex-1"
              :ui="{ base: 'text-center' }"
              aria-label="Текущие хиты или сдвиг"
              @focus="onDraftFocus"
              @click.left.exact="onDraftClick"
              @keydown.enter.prevent="applyDraft"
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
