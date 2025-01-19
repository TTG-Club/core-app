<script setup lang="ts">
  import { Dictionaries } from '~/shared';

  const model = defineModel<Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-sizes',
    () => Dictionaries.sizes(),
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
    placeholder="Выбери размер существа"
    max-tag-count="responsive"
    mode="multiple"
    show-arrow
    show-search
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
