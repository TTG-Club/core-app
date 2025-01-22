<script setup lang="ts">
  import { Dictionaries } from '~/shared/api';

  withDefaults(
    defineProps<{
      disabled?: boolean;
      multiple?: boolean;
    }>(),
    {
      disabled: false,
      multiple: false,
    },
  );

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-duration-types',
    () => Dictionaries.durationTypes(),
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
    :disabled
    placeholder="Выбери тип длительности"
    max-tag-count="responsive"
    show-search
    allow-clear
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
