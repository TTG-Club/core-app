<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/types';

  interface SubclassSelectItem {
    label: string;
    value: string;
    description: string;
    source: string;
  }

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData<SubclassSelectItem[]>(
    'subclasses-select',
    async () => {
      const classesLinks = await $fetch<Array<ClassLinkResponse>>(
        '/api/v2/classes/subclasses',
        { method: 'get' },
      );

      return classesLinks.map((classLink) => ({
        label: classLink.name.rus,
        value: classLink.url,
        description: classLink.name.eng,
        source: classLink.source.name.label,
      }));
    },
    {
      dedupe: 'defer',
      lazy: true,
    },
  );

  const handleDropdownOpening = useDebounceFn(async (state: boolean) => {
    if (!state) {
      return;
    }

    await refresh();
  }, 250);
</script>

<template>
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="data"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери подкласс${multiple ? 'ы' : ''}`"
    label-key="label"
    value-key="value"
    clearable
    searchable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
    @update:open="handleDropdownOpening"
  >
    <template #item-trailing="{ item }">
      <UBadge
        variant="subtle"
        color="neutral"
      >
        {{ item.source }}
      </UBadge>
    </template>
  </USelectMenu>
</template>
