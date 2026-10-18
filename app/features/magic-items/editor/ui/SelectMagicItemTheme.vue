<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { placeholder } = defineProps<{
    placeholder: string;
  }>();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-magic-items-theme',
    () => DictionaryService.magicItemTheme(),
    { dedupe: 'defer' },
  );

  function handleDropdownOpening(state: boolean) {
    if (!state) {
      return;
    }

    refresh();
  }
</script>

<template>
  <USelect
    v-model="model"
    :loading="status === 'pending'"
    :items="data || []"
    :placeholder="placeholder"
    clearable
    @open="handleDropdownOpening(true)"
  />
</template>
