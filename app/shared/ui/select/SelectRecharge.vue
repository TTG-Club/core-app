<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { disabled } = defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-recharge',
    () => DictionaryService.recharge(),
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
    placeholder="Выбери перезарядку"
    clearable
    :loading="status === 'pending'"
    :items="data || []"
    :disabled="disabled"
    @open="handleDropdownOpening(true)"
  />
</template>
