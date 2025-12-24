<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/types';
  import { debounce } from 'lodash-es';
  import { onBeforeUnmount, ref } from 'vue';

  type ClassSelectItem = {
    label: string;
    value: string;
    description: string;
    source: string;
  };

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const searchQuery = ref('');
  const openedOnce = ref(false);

  const { data, status, refresh } = await useAsyncData<ClassSelectItem[]>(
    'classes-select',
    async () => {
      const classesLinks = await $fetch<Array<ClassLinkResponse>>(
        '/api/v2/classes/search',
        {
          method: 'post',
          query: {
            query: searchQuery.value || undefined,
          },
        },
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
    },
  );

  const handleDropdownOpening = async (state: boolean) => {
    if (!state || openedOnce.value) {
      return;
    }

    openedOnce.value = true;
    await refresh();
  };

  const debouncedRefresh = debounce(() => {
    refresh();
  }, 250);

  onBeforeUnmount(() => {
    debouncedRefresh.cancel();
  });

  const handleSearch = (value: string) => {
    searchQuery.value = value;

    if (!openedOnce.value) {
      return;
    }

    debouncedRefresh();
  };
</script>

<template>
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="data"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери класс${multiple ? 'ы' : ''}`"
    label-key="label"
    value-key="value"
    ignore-filter
    clearable
    searchable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
    @update:search-term="handleSearch"
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
