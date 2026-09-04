<script setup lang="ts">
  import type { SheetChoiceOption, SheetChoicePoolStatus } from '../../model';

  import {
    getChoiceSelectionSummary,
    SHEET_CHOICE_PICKER_LABELS,
  } from '../../model';
  import SheetChoicePickerModal from './SheetChoicePickerModal.vue';

  /** Чип выбранного варианта в поле. */
  interface ChosenChip {
    value: string;
    label: string;
    removeAriaLabel: string;
  }

  /**
   * Поле единого пикера в карточке умения: заголовок с пояснением, выбранное
   * чипами и кнопка, открывающая окно со списком. Одно на все выборы листа —
   * навыки, заклинания, черты, подклассы и варианты умений спрашиваются
   * одинаково, а не то селектом, то бейджами, то своим окном.
   */
  const {
    title,
    explanation = '',
    options,
    count = 0,
    status = 'ready',
    warning = '',
    modalTitle = '',
    modalSubtitle = '',
    hideDetailPane = false,
  } = defineProps<{
    title: string;

    /** Почему этот выбор здесь: «Умение даёт заклинание 6 круга на выбор». */
    explanation?: string;

    options: SheetChoiceOption[];

    /** Сколько нужно выбрать; 0 — без предела, 1 — одиночный выбор. */
    count?: number;

    /** Готовность пула: пока он в пути или не загрузился, выбирать нечего. */
    status?: SheetChoicePoolStatus;

    /** Предупреждение под полем, если выбран помеченный вариант. */
    warning?: string;

    /** Заголовок окна; пусто — заголовок поля. */
    modalTitle?: string;

    /** Подзаголовок окна: откуда выбор и сколько выбрать. */
    modalSubtitle?: string;

    /** Описание в окне — только дровером, без панели рядом со списком. */
    hideDetailPane?: boolean;
  }>();

  const emit = defineEmits<{
    /** Пул не загрузился — игрок просит запросить его заново. */
    retry: [];
  }>();

  const model = defineModel<string[]>({ default: () => [] });

  const overlay = useOverlay();

  // Без destroyOnClose: закрытая модалка остаётся в оверлее, и повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const pickerModal = overlay.create(SheetChoicePickerModal);

  const optionsByValue = computed(
    () => new Map(options.map((option) => [option.value, option])),
  );

  /**
   * Выбранное чипами. Значение, которого в пуле нет, — прежний ответ с листа:
   * показывается как есть, чтобы его можно было снять.
   */
  const chosen = computed<ChosenChip[]>(() =>
    model.value.map((value) => {
      const label = optionsByValue.value.get(value)?.label ?? value;

      return {
        value,
        label,
        removeAriaLabel: `${SHEET_CHOICE_PICKER_LABELS.remove}: ${label}`,
      };
    }),
  );

  const countLabel = computed(() =>
    getChoiceSelectionSummary(model.value.length, count),
  );

  const isLoading = computed(() => status === 'loading');

  const hasError = computed(() => status === 'error');

  const isEmptyPool = computed(
    () => status === 'ready' && options.length === 0,
  );

  const chooseLabel = computed(() =>
    model.value.length
      ? SHEET_CHOICE_PICKER_LABELS.change
      : SHEET_CHOICE_PICKER_LABELS.choose,
  );

  const isWarningVisible = computed(
    () =>
      Boolean(warning)
      && model.value.some((value) => optionsByValue.value.get(value)?.hint),
  );

  /**
   * Открывает окно выбора. Закрытие без «Сохранить» ничего не меняет: окно
   * правит копию выбранного.
   */
  async function handleChoose() {
    const values = await pickerModal.open({
      title: modalTitle || title,
      subtitle: modalSubtitle,
      options,
      count,
      selected: model.value,
      hideDetailPane,
    }).result;

    if (values === undefined) {
      return;
    }

    model.value = values;
  }

  /**
   * Снимает вариант с выбранного: добрать его можно тем же окном.
   *
   * @param value значение варианта.
   */
  function handleRemove(value: string) {
    model.value = model.value.filter((entry) => entry !== value);
  }

  function handleRetry() {
    emit('retry');
  }
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex flex-wrap items-baseline justify-between gap-x-2">
      <span class="text-sm font-medium text-highlighted">{{ title }}</span>

      <span class="text-xs text-dimmed">{{ countLabel }}</span>
    </div>

    <span
      v-if="explanation"
      class="text-xs text-muted"
    >
      {{ explanation }}
    </span>

    <div
      class="flex flex-wrap items-center gap-2 rounded-md border border-default/60 bg-elevated/30 p-2"
    >
      <template v-if="isLoading">
        <UIcon
          name="tabler:loader-2"
          class="size-4 shrink-0 animate-spin text-dimmed"
        />

        <span class="text-sm text-dimmed">
          {{ SHEET_CHOICE_PICKER_LABELS.loading }}
        </span>
      </template>

      <template v-else-if="hasError">
        <span class="text-sm text-error">
          {{ SHEET_CHOICE_PICKER_LABELS.loadError }}
        </span>

        <UButton
          icon="tabler:refresh"
          size="xs"
          color="neutral"
          variant="subtle"
          class="ml-auto shrink-0"
          :label="SHEET_CHOICE_PICKER_LABELS.retry"
          @click.left.exact.prevent="handleRetry"
        />
      </template>

      <span
        v-else-if="isEmptyPool"
        class="text-sm text-dimmed italic"
      >
        {{ SHEET_CHOICE_PICKER_LABELS.noOptions }}
      </span>

      <template v-else>
        <span
          v-if="!chosen.length"
          class="text-sm text-dimmed italic"
        >
          {{ SHEET_CHOICE_PICKER_LABELS.notChosen }}
        </span>

        <span
          v-for="chip in chosen"
          :key="chip.value"
          class="inline-flex max-w-full items-center gap-1 rounded-md border border-primary/40 bg-primary/10 py-0.5 pr-0.5 pl-2 text-sm text-highlighted"
        >
          <span class="truncate">{{ chip.label }}</span>

          <UButton
            icon="tabler:x"
            size="xs"
            color="neutral"
            variant="ghost"
            square
            :aria-label="chip.removeAriaLabel"
            @click.left.exact.prevent="handleRemove(chip.value)"
          />
        </span>

        <UButton
          icon="tabler:list-search"
          size="sm"
          color="primary"
          variant="soft"
          class="ml-auto shrink-0"
          :label="chooseLabel"
          @click.left.exact.prevent="handleChoose"
        />
      </template>
    </div>

    <span
      v-if="isWarningVisible"
      class="text-xs text-warning"
    >
      {{ warning }}
    </span>
  </div>
</template>
