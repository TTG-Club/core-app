<script setup lang="ts">
  import type { FeatLinkResponse } from '~/shared/types';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const searchQuery = ref('');

  const { data, status, refresh } = await useAsyncData(
    'feat-select',
    async () => {
      const featLinks = await $fetch<Array<FeatLinkResponse>>(
        '/api/v2/feats/search',
        {
          method: 'post',
          query: {
            query: searchQuery.value || undefined,
          },
        },
      );

      return featLinks.map((feat) => ({
        label: feat.name.rus,
        value: feat.url,
        description: feat.name.eng,
        source: feat.source.name.label,
      }));
    },
    {
      watch: [searchQuery],
      dedupe: 'defer',
    },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };

  const handleSearch = (value: string) => {
    searchQuery.value = value;
  };
</script>

<template>
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="data"
    :multiple="multiple"
    :disabled="disabled"
    placeholder="Выбери черту"
    label-key="label"
    value-key="value"
    ignore-filter
    searchable
    clearable
    :filter="false"
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
