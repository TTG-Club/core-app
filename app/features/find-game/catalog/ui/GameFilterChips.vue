<script setup lang="ts">
  import type { FilterSelection } from '../../model';

  import {
    FILTER_CHIP_EXCLUDED_HINT,
    FILTER_CHIP_INCLUDED_HINT,
    FILTER_CHIP_NEUTRAL_HINT,
  } from '../../model';

  interface FilterChipOption {
    value: string;
    label: string;
    icon?: string;
  }

  const { label, options } = defineProps<{
    label: string;
    options: ReadonlyArray<FilterChipOption>;
  }>();

  /**
   * Обе половины выбора приходят одним значением: нажатие на чип меняет их
   * вместе, а раздельные `v-model` в одном такте теряют одно из обновлений —
   * пропсы доезжают сюда только на следующем рендере, и вторая запись
   * перетирает первую.
   */
  const selection = defineModel<FilterSelection>({ required: true });

  /**
   * Состояние значения: обычное, включено в поиск или исключено из него.
   * @param value Значение фильтра.
   */
  function getChipState(value: string): 'neutral' | 'included' | 'excluded' {
    if (selection.value.included.includes(value)) {
      return 'included';
    }

    if (selection.value.excluded.includes(value)) {
      return 'excluded';
    }

    return 'neutral';
  }

  /**
   * Один чип объединяет включение и исключение: нажатие переключает значение
   * по кругу «не важно → нужно → не нужно». Так оба условия сервиса помещаются
   * в один компактный ряд, а не в две отдельные формы.
   * @param value Значение фильтра.
   */
  function toggleChip(value: string): void {
    const state = getChipState(value);
    const { included, excluded } = selection.value;

    const withoutValue = {
      included: included.filter((item) => item !== value),
      excluded: excluded.filter((item) => item !== value),
    };

    if (state === 'neutral') {
      selection.value = {
        ...withoutValue,
        included: [...withoutValue.included, value],
      };

      return;
    }

    if (state === 'included') {
      selection.value = {
        ...withoutValue,
        excluded: [...withoutValue.excluded, value],
      };

      return;
    }

    selection.value = withoutValue;
  }

  /** Иконка, подсказка и оформление чипа по его состоянию. */
  const CHIP_APPEARANCE = {
    neutral: {
      color: 'primary',
      variant: 'outline',
      icon: null,
      hint: FILTER_CHIP_NEUTRAL_HINT,
    },
    included: {
      color: 'primary',
      variant: 'solid',
      icon: 'tabler:plus',
      hint: FILTER_CHIP_INCLUDED_HINT,
    },
    excluded: {
      color: 'error',
      variant: 'solid',
      icon: 'tabler:minus',
      hint: FILTER_CHIP_EXCLUDED_HINT,
    },
  } as const;

  const chips = computed(() =>
    options.map((option) => {
      const state = getChipState(option.value);
      const appearance = CHIP_APPEARANCE[state];

      return {
        ...option,
        state,
        color: appearance.color,
        variant: appearance.variant,
        // У нетронутого значения своя иконка из настроек фильтра, у выбранного
        // её вытесняет плюс или минус — иначе непонятно, что именно нажато.
        leadingIcon: appearance.icon ?? option.icon,
        hint: appearance.hint,
      };
    }),
  );
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <legend class="mb-2 text-sm font-medium text-highlighted">
      {{ label }}
    </legend>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="chip in chips"
        :key="chip.value"
        size="sm"
        :color="chip.color"
        :variant="chip.variant"
        :icon="chip.leadingIcon"
        :label="chip.label"
        :aria-pressed="chip.state !== 'neutral'"
        :title="chip.hint"
        @click.left.exact.prevent="toggleChip(chip.value)"
      />
    </div>
  </fieldset>
</template>
