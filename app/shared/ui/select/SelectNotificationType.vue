<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-notification-types',
    () => DictionaryService.notificationTypes(),
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
    :placeholder="`Выбери тип нотификации`"
    :loading="status === 'pending'"
    :items="data || []"
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
