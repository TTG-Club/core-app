<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  import type { AbilityKey } from '~/shared/types';

  const {
    disabled = false,
    multiple = false,
    limit = 0,
    only = [],
    exclude = [],
    placeholder = '',
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    limit?: number;
    /**
     * Ограничить список вариантов (например, 3 характеристики из предыстории).
     * Пустой массив = без ограничения.
     */
    only?: Array<AbilityKey>;
    /**
     * Запретить выбор определённых значений (например, чтобы исключить дубли).
     */
    exclude?: Array<AbilityKey>;
    /**
     * Placeholder селекта.
     */
    placeholder?: string;
  }>();

  const model = defineModel<AbilityKey | Array<AbilityKey>>();

  const { data, refresh } = await useAsyncData(
    'dictionaries-abilities',
    () => DictionaryService.abilities(),
    { dedupe: 'defer' },
  );

  const selectedValues = computed<Array<AbilityKey>>(() => {
    const v = model.value;

    if (!v) {
      return [];
    }

    if (Array.isArray(v)) {
      return v;
    }

    return [v];
  });

  const isLimitReached = computed<boolean>(() => {
    if (!multiple) {
      return false;
    }

    if (limit <= 0) {
      return false;
    }

    return selectedValues.value.length >= limit;
  });

  const options = computed(() => {
    const list = data.value;

    if (!list) {
      return [];
    }

    const allowed = only.length > 0 ? only : null;

    return list
      .filter((ability) => {
        if (!allowed) {
          return true;
        }

        return allowed.includes(ability.value);
      })
      .map((ability) => {
        const isSelected = selectedValues.value.includes(ability.value);
        const isExcluded = exclude.includes(ability.value);

        const itemDisabled =
          isExcluded || (isLimitReached.value && !isSelected);

        return {
          ...ability,
          disabled: itemDisabled,
        };
      });
  });

  const resolvedPlaceholder = computed<string>(() => {
    if (placeholder.length > 0) {
      return placeholder;
    }

    return `Выбери характеристик${multiple ? 'и' : 'у'}`;
  });

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <USelect
    v-model="model"
    :placeholder="resolvedPlaceholder"
    :multiple="multiple"
    :items="options"
    :disabled="disabled"
    clearable
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
