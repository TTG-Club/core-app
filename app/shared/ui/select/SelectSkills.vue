<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false, limit = 0 } = defineProps<{
    disabled?: boolean;
    limit?: number;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, refresh } = await useAsyncData(
    'dictionaries-skills',
    () => DictionaryService.skills(),
    { dedupe: 'defer' },
  );

  const options = computed(() => {
    if (!data.value) return [];

    if (!multiple) {
      return data.value;
    }

    const disabled = !!model.value && !!limit && model.value.length >= limit;

    return data.value.map((skill) => ({
      ...skill,
      disabled: disabled && !model.value?.includes(skill.value),
    }));
  });

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };

  const placeholder = computed(() => {
    if (!multiple) {
      return 'Выбери навык';
    }

    if (!limit) {
      return 'Выбери навыки';
    }

    const plural = getPlural(limit, ['навык', 'навыка', 'навыков']);

    return `Выбери ${limit} ${plural}`;
  });
</script>

<template>
  <USelect
    v-model="model"
    :items="options"
    :placeholder="placeholder"
    :disabled="disabled"
    :multiple
    searchable
    clearable
    @open="handleDropdownOpening(true)"
  >
    <template #trailing>
      <slot name="trailing" />
    </template>
  </USelect>
</template>
