<script setup lang="ts">
  import { debounce } from 'lodash-es';
  import { onBeforeUnmount, ref } from 'vue';
  import type { BackgroundLinkResponse } from '~/shared/types';

  type BackgroundSelectItem = {
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

  const { data, status, refresh } = await useAsyncData<BackgroundSelectItem[]>(
    'backgrounds-select',
    async () => {
      const backgroundsLinks = await $fetch<Array<BackgroundLinkResponse>>(
        '/api/v2/backgrounds/select',
        {
          method: 'get',
          query: {
            query: searchQuery.value || undefined,
          },
        },
      );

      return backgroundsLinks.map((backgroundLink) => ({
        label: backgroundLink.name.rus,
        value: backgroundLink.url,
        description: backgroundLink.name.eng,
        source: backgroundLink.source.name.label,
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
    :placeholder="`Выбери предыстори${multiple ? 'и' : 'ю'}`"
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
