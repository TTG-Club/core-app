<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/types';

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

  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  const { data, status, refresh } = await useAsyncData<ClassSelectItem[]>(
    () => `classes-select:${searchQuery.value}`,
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
      immediate: false,
      default: () => [],
      dedupe: 'defer',
    },
  );

  const items = computed(() => data.value);

  const handleDropdownOpening = async (state: boolean) => {
    if (!state) {
      return;
    }

    if (!openedOnce.value) {
      openedOnce.value = true;
      await refresh();
    }
  };

  const handleSearch = (value: string) => {
    searchQuery.value = value;

    if (!openedOnce.value) {
      return;
    }

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      refresh();
    }, 250);
  };
</script>

<template>
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="items"
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
