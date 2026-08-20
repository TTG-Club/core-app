<script setup lang="ts">
  import { SHEET_CHOICE_BADGE_MAX_OPTIONS } from '../../model';

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
      class="flex flex-wrap gap-2"
    >
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

    <USelectMenu
      v-else-if="isMultiple"
      v-model="model"
      :items="options"
      :placeholder="placeholder"
      label-key="label"
      value-key="value"
      multiple
      searchable
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
    >
      <template #item-trailing="{ item }">
        <ReuseHintBadge :hint="item.hint" />
      </template>
    </USelectMenu>

    <span
      v-if="isWarningVisible"
      class="text-xs text-warning"
    >
      {{ warning }}
    </span>
  </div>
</template>
