<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false, limit = 0 } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    limit?: number;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, refresh } = await useAsyncData(
    'dictionaries-weapon-categories',
    () => DictionaryService.weaponCategories(),
    { dedupe: 'defer' },
  );

  const options = computed(() => {
    if (!data.value) return [];

    const disabled = !!model.value && !!limit && model.value.length >= limit;

    return data.value.map((category) => ({
      ...category,
      disabled: disabled && !model.value?.includes(category.value),
    }));
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
    :placeholder="`Выбери вид${multiple ? 'ы' : ''} оружия`"
    :multiple="multiple"
    :items="options"
    :disabled="disabled"
    clearable
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
