<script setup lang="ts">
  import { Dictionaries } from '~/shared/api';

  withDefaults(
    defineProps<{
      multiple?: boolean;
    }>(),
    {
      multiple: false,
    },
  );

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-schools',
    () => Dictionaries.schools(),
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
    :mode="multiple ? 'multiple' : undefined"
    max-tag-count="responsive"
    placeholder="Выбери школу"
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
