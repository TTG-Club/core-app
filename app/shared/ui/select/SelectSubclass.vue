<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/types';
  import type { SelectMenuItem } from '#ui/components/SelectMenu.vue';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData<SelectMenuItem[]>(
    'subclasses-select',
    async () => {
      const classesLinks = await $fetch<Array<ClassLinkResponse>>(
        '/api/v2/classes/subclasses',
      );

      return classesLinks.map((classLink) => ({
        ...classLink,
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
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери подкласс${multiple ? 'ы' : ''}`"
    label-key="label"
    value-key="value"
    clearable
    searchable
    @update:open="handleDropdownOpening"
  />
</template>
