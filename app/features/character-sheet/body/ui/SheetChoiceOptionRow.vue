<script setup lang="ts">
  import type { SheetChoiceOption } from '../../model';

  import { SHEET_CHOICE_PICKER_LABELS } from '../../model';

  /**
   * Строка списка единого пикера: две соседние кнопки — отметка выбора с
   * названием и просмотр описания. Раздельными они потому, что читать описание
   * приходится чаще, чем выбирать: маленькая иконка на краю строки мазалась
   * мимо, а клик по названию норовил отметить вариант вместо того, чтобы
   * показать, что он делает.
   *
   * Одна строка на все виды выбора — навыки, заклинания, черты, подклассы и
   * варианты умений выглядят одинаково.
   */
  const {
    option,
    selected,
    disabled = false,
    active = false,
    multiple,
    preview = false,
  } = defineProps<{
    option: SheetChoiceOption;

    /** Вариант отмечен в черновике выбора. */
    selected: boolean;

    /** Вариант взять нельзя: предел набран либо вариант недоступен по уровню. */
    disabled?: boolean;

    /** Описание варианта показано в панели рядом со списком. */
    active?: boolean;

    /** Выбор нескольких вариантов: отметка квадратом, а не кружком. */
    multiple: boolean;

    /**
     * Описание открывается панелью рядом со списком: тогда по названию идёт
     * просмотр, а отмечает вариант только кнопка с отметкой. Без панели
     * название отмечает вариант, а описание открывает соседняя кнопка.
     */
    preview?: boolean;
  }>();

  const emit = defineEmits<{
    toggle: [];
    detail: [];
  }>();

  const icon = computed(() => {
    if (multiple) {
      return selected ? 'tabler:square-check' : 'tabler:square';
    }

    return selected ? 'tabler:circle-check' : 'tabler:circle';
  });

  const iconClass = computed(() => (selected ? 'text-primary' : 'text-dimmed'));

  const hasDetail = computed(() => option.detail !== undefined);

  /** Описание открывается соседней кнопкой: панели рядом со списком нет. */
  const isDetailButtonVisible = computed(() => hasDetail.value && !preview);

  /** По названию идёт просмотр описания, а не отметка варианта. */
  const isNameForPreview = computed(() => preview && hasDetail.value);

  const rowClass = computed(() => {
    if (active) {
      return 'bg-elevated ring-1 ring-primary/40';
    }

    return selected ? 'bg-elevated/60' : '';
  });

  /**
   * Оформление кнопки: недоступную не подсвечиваем и курсор не меняем —
   * нажатие всё равно ничего не даст.
   *
   * @param isDisabled кнопка недоступна.
   * @returns классы кнопки.
   */
  function getButtonClass(isDisabled: boolean): string {
    return isDisabled
      ? 'cursor-not-allowed opacity-50'
      : 'cursor-pointer hover:bg-elevated/60';
  }

  const detailAriaLabel = computed(
    () => `${SHEET_CHOICE_PICKER_LABELS.detailAriaLabel}: ${option.label}`,
  );

  function handleToggle() {
    if (!disabled) {
      emit('toggle');
    }
  }

  function handleDetail() {
    emit('detail');
  }

  /** Нажатие по названию: просмотр описания рядом со списком либо отметка. */
  function handleName() {
    if (isNameForPreview.value) {
      emit('detail');

      return;
    }

    handleToggle();
  }
</script>

<template>
  <div
    class="flex items-stretch gap-1 rounded-md p-0.5 transition-colors"
    :class="rowClass"
  >
    <!-- Отметка выбора: своей кнопкой, чтобы в неё попадали пальцем -->
    <button
      v-if="isNameForPreview"
      type="button"
      class="flex shrink-0 items-center rounded-md px-2 transition-colors"
      :class="getButtonClass(disabled)"
      :disabled="disabled"
      :aria-pressed="selected"
      :aria-label="option.label"
      @click.left.exact.prevent="handleToggle"
    >
      <UIcon
        :name="icon"
        class="size-5"
        :class="iconClass"
      />
    </button>

    <button
      type="button"
      class="flex min-w-0 grow items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
      :class="getButtonClass(!isNameForPreview && disabled)"
      :disabled="!isNameForPreview && disabled"
      :aria-pressed="isNameForPreview ? undefined : selected"
      @click.left.exact.prevent="handleName"
    >
      <UIcon
        v-if="!isNameForPreview"
        :name="icon"
        class="size-5 shrink-0"
        :class="iconClass"
      />

      <span class="flex min-w-0 grow flex-col">
        <span class="truncate text-sm text-highlighted">
          {{ option.label }}
        </span>

        <span
          v-if="option.sublabel"
          class="truncate text-xs text-dimmed"
        >
          {{ option.sublabel }}
        </span>
      </span>

      <UBadge
        v-if="option.hint"
        size="sm"
        color="warning"
        variant="subtle"
        class="shrink-0"
      >
        {{ option.hint }}
      </UBadge>

      <UBadge
        v-for="badge in option.badges"
        :key="badge"
        size="sm"
        color="neutral"
        variant="subtle"
        class="shrink-0"
      >
        {{ badge }}
      </UBadge>
    </button>

    <!-- Описание — соседней кнопкой во всю высоту строки: прежняя иконка на
      краю была слишком мелкой для попадания -->
    <UTooltip
      v-if="isDetailButtonVisible"
      :text="SHEET_CHOICE_PICKER_LABELS.detailTooltip"
    >
      <UButton
        icon="tabler:layout-sidebar-right-expand"
        color="neutral"
        variant="subtle"
        square
        class="w-10 shrink-0 cursor-pointer justify-center self-stretch"
        :ui="{ leadingIcon: 'size-5' }"
        :aria-label="detailAriaLabel"
        @click.left.exact.prevent="handleDetail"
      />
    </UTooltip>
  </div>
</template>
