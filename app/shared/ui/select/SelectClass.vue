<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/types';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'classes-select',
    async () => {
      const classesLinks = await $fetch<Array<ClassLinkResponse>>(
        '/api/v2/classes/search',
        {
          method: 'post',
        },
      );

      return classesLinks.map((classLink) => ({
        label: `${classLink.name.rus} [${classLink.name.eng}]`,
        value: classLink.url,
      }));
    },
    { dedupe: 'defer' },
  );

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
    :loading="status === 'pending'"
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    placeholder="Выбери класс"
    clearable
    searchable
    @update:open="handleDropdownOpening(true)"
  />
</template>
