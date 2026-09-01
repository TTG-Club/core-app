<script setup lang="ts">
  import type { FeatureOptionEntry } from '~classes/model';

  import { FeatureOptionsDrawer } from '~classes/feature-options-drawer';

  import {
    getChoiceSelectionSummary,
    SHEET_CHOICE_BADGE_MAX_OPTIONS,
    SHEET_CHOICE_OPTIONS_LABELS,
  } from '../../model';

  /** Опция списка с пометкой того, что выбор у персонажа уже есть. */
  interface ChoiceItem {
    label: string;
    value: string;
    hint: string;
  }

  /** Опция-бейдж: вид кнопки зависит от того, выбрана ли она и можно ли ещё. */
  interface ChoiceBadge extends ChoiceItem {
    selected: boolean;
    disabled: boolean;
    color: 'primary' | 'neutral';
    variant: 'solid' | 'subtle';
    class: string;
  }

  const {
    count = 0,
    hints = {},
    items,
    optionDetails = [],
    optionDetailsTitle = '',
    placeholder = '',
    warning = '',
  } = defineProps<{
    items: string[];

    /** Сколько значений нужно выбрать; 0 — без ограничения. */
    count?: number;

    placeholder?: string;

    /** Пометки опций: значение → подпись бейджа (например, «уже есть»). */
    hints?: Record<string, string>;

    /** Предупреждение под списком, если выбрана помеченная опция. */
    warning?: string;

    /**
     * Описания вариантов из записи справочника: с ними у выбора появляется
     * кнопка просмотра, где вариант читают и берут. Пусто — кнопки нет.
     */
    optionDetails?: FeatureOptionEntry[];

    /** Заголовок просмотра описаний; пусто — общая подпись. */
    optionDetailsTitle?: string;
  }>();

  const model = defineModel<string[]>({ default: () => [] });

  // Выбор одного значения — одиночный селект: один клик сразу переключает выбор
  // (в множественном пришлось бы снимать старый и ставить новый). Несколько или
  // без ограничения — множественный селект.
  const isMultiple = computed(() => count !== 1);

  const options = computed<ChoiceItem[]>(() =>
    items.map((name) => ({
      label: name,
      value: name,
      hint: hints[name] ?? '',
    })),
  );

  /**
   * Короткий набор показывается бейджами: класс списка заклинаний или
   * заклинательная характеристика — это два-три варианта, и в выпадающем списке
   * игрок их не видит, пока не откроет его. Длинный набор бейджами не показать —
   * ряд занял бы весь экран, и искать в нём нечем.
   */
  const isBadgeMode = computed(
    () =>
      options.value.length > 0
      && options.value.length <= SHEET_CHOICE_BADGE_MAX_OPTIONS,
  );

  /** Выбрано столько, сколько просили: остальные варианты недоступны. */
  const isLimitReached = computed(
    () => count > 0 && model.value.length >= count,
  );

  const badges = computed<ChoiceBadge[]>(() =>
    options.value.map((option) => {
      const selected = model.value.includes(option.value);

      // У выбора одного значения предела нет: клик по другому варианту
      // переключает выбор, а не упирается в «уже выбрано».
      const disabled = !selected && isMultiple.value && isLimitReached.value;

      return {
        ...option,
        selected,
        disabled,
        color: selected ? 'primary' : 'neutral',
        variant: selected ? 'solid' : 'subtle',
        class: disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer transition-colors',
      };
    }),
  );

  /**
   * Переключает вариант. Выбор одного значения заменяет прежний ответ, выбор
   * нескольких копит их до предела.
   *
   * @param badge вариант-бейдж.
   */
  function toggleBadge(badge: ChoiceBadge) {
    if (badge.disabled) {
      return;
    }

    if (badge.selected) {
      model.value = model.value.filter((name) => name !== badge.value);

      return;
    }

    model.value = isMultiple.value
      ? [...model.value, badge.value]
      : [badge.value];
  }

  const singleValue = computed<string | undefined>({
    get: () => model.value[0],
    set: (value) => {
      model.value = value ? [value] : [];
    },
  });

  const isWarningVisible = computed(
    () => Boolean(warning) && model.value.some((name) => hints[name]),
  );

  const isOptionDetailsAvailable = computed(() => optionDetails.length > 0);

  const isOptionDetailsOpened = ref(false);

  /**
   * Варианты для просмотра — ровно те, что предлагает пикер: описания идут из
   * записи класса, а вариант без описания остаётся в списке одним названием.
   */
  const optionDetailEntries = computed<FeatureOptionEntry[]>(() =>
    options.value.map((option) => {
      const detail = optionDetails.find((entry) => entry.name === option.value);

      return (
        detail ?? {
          key: option.value,
          name: option.value,
          nameEng: '',
          description: '',
          additional: '',
          prerequisite: '',
          requiredClassLevel: 0,
        }
      );
    }),
  );

  /** Варианты, которые в просмотре взять нельзя: предел выбора уже набран. */
  const disabledOptionNames = computed(() =>
    badges.value.filter((badge) => badge.disabled).map((badge) => badge.value),
  );

  const optionDetailsSummary = computed(() =>
    getChoiceSelectionSummary(model.value.length, count),
  );

  const optionDetailsHeading = computed(
    () => optionDetailsTitle || SHEET_CHOICE_OPTIONS_LABELS.button,
  );

  /**
   * Открывает просмотр описаний вариантов.
   */
  function openOptionDetails() {
    isOptionDetailsOpened.value = true;
  }

  /**
   * Переключает вариант, выбранный в просмотре описаний: правила у выбора те
   * же, что у бейджей, поэтому ответ считает та же функция.
   *
   * @param name название варианта.
   */
  function handleOptionDetailToggle(name: string) {
    const badge = badges.value.find((entry) => entry.value === name);

    if (badge) {
      toggleBadge(badge);
    }
  }

  // Пометка опции одна и та же в обоих селектах, а слот у каждого свой.
  const [DefineHintBadge, ReuseHintBadge] = createReusableTemplate<{
    hint: string;
  }>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <DefineHintBadge v-slot="{ hint }">
      <UBadge
        v-if="hint"
        size="sm"
        color="neutral"
        variant="subtle"
      >
        {{ hint }}
      </UBadge>
    </DefineHintBadge>

    <!-- Короткий набор: все варианты на виду, выбранный залит цветом -->
    <div
      v-if="isBadgeMode"
      class="flex flex-wrap items-center gap-2"
    >
      <!-- Кнопка описаний открывает ряд вариантов: её читают до того, как
      выбирать, а в хвосте ряда она уезжала на отдельную строку -->
      <UButton
        v-if="isOptionDetailsAvailable"
        size="sm"
        icon="tabler:list-search"
        color="neutral"
        variant="ghost"
        :label="SHEET_CHOICE_OPTIONS_LABELS.button"
        @click.left.exact.prevent="openOptionDetails"
      />

      <UBadge
        v-for="badge in badges"
        :key="badge.value"
        as="button"
        type="button"
        size="lg"
        :color="badge.color"
        :variant="badge.variant"
        :class="badge.class"
        :disabled="badge.disabled"
        :aria-pressed="badge.selected"
        @click.left.exact.prevent="toggleBadge(badge)"
      >
        {{ badge.label }}

        <span
          v-if="badge.hint"
          class="text-xs opacity-70"
        >
          {{ badge.hint }}
        </span>
      </UBadge>
    </div>

    <div
      v-else
      class="flex items-center gap-2"
    >
      <USelectMenu
        v-if="isMultiple"
        v-model="model"
        :items="options"
        :placeholder="placeholder"
        label-key="label"
        value-key="value"
        multiple
        searchable
        class="min-w-0 grow"
      >
        <template #item-trailing="{ item }">
          <ReuseHintBadge :hint="item.hint" />
        </template>
      </USelectMenu>

      <USelectMenu
        v-else
        v-model="singleValue"
        :items="options"
        :placeholder="placeholder"
        label-key="label"
        value-key="value"
        searchable
        class="min-w-0 grow"
      >
        <template #item-trailing="{ item }">
          <ReuseHintBadge :hint="item.hint" />
        </template>
      </USelectMenu>

      <UTooltip
        v-if="isOptionDetailsAvailable"
        :text="SHEET_CHOICE_OPTIONS_LABELS.button"
      >
        <UButton
          icon="tabler:list-search"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          class="shrink-0"
          :aria-label="SHEET_CHOICE_OPTIONS_LABELS.ariaLabel"
          @click.left.exact.prevent="openOptionDetails"
        />
      </UTooltip>
    </div>

    <span
      v-if="isWarningVisible"
      class="text-xs text-warning"
    >
      {{ warning }}
    </span>

    <FeatureOptionsDrawer
      v-if="isOptionDetailsAvailable"
      v-model="isOptionDetailsOpened"
      :options="optionDetailEntries"
      :title="optionDetailsHeading"
      :summary="optionDetailsSummary"
      :selected-names="model"
      :disabled-names="disabledOptionNames"
      selectable
      @toggle="handleOptionDetailToggle"
    />
  </div>
</template>
