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
          params: {
            query: searchQuery.value || undefined,
          },
        },
      );

      return featLinks.map((feat) => ({
        label: `${feat.name.rus} [${feat.name.eng}]`,
        value: feat.url,
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
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    placeholder="Выбери черту"
    searchable
    clearable
    :filter="false"
    @open="handleDropdownOpening(true)"
    @search="handleSearch"
  />
</template>
