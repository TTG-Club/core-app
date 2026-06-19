<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { disabled } = defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-weapon-mastery',
    () => DictionaryService.weaponMastery(),
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
    placeholder="Выбери приём оружия"
    :loading="status === 'pending'"
    :items="data || []"
    :disabled="disabled"
    clearable
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
