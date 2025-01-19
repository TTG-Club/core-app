<script setup lang="ts">
  import { Dictionaries } from '~/shared';

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-creature-types',
    () => Dictionaries.creatureTypes(),
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <ASelect
    v-model:value="model"
    :loading="status === 'pending'"
    :options="data || []"
    placeholder="Выбери тип существа"
    show-search
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
