<script setup lang="ts">
  import type { z } from 'zod';

  import type {
    CreatureSearchItem,
    CreatureSearchPage,
    CreatureSearchPage as CreatureSearchPageType,
  } from '../model';

  import { refDebounced, useDebounceFn } from '@vueuse/core';

  import { useAsyncData } from '#imports';

  import {
    CREATURE_SEARCH_MIN_LENGTH,
    CREATURE_SEARCH_PAGE_SIZE,
    creatureSearchResponseSchema,
    INITIATIVE_TRACKER_ENDPOINTS,
  } from '../model';

  const model = defineModel<string>({ default: '' });

  const search = ref('');
  const searchQuery = refDebounced(search, 250);

  function normalizeCreatureSearch(
    response: z.output<typeof creatureSearchResponseSchema>,
  ): CreatureSearchPage {
    if (Array.isArray(response)) {
      return {
        value: response,
        Count: response.length,
      };
    }

    return response;
  }

  function createCreatureSearchItem(
    creature: CreatureSearchPageType['value'][number],
  ): CreatureSearchItem {
    return {
      label: creature.name.rus,
      value: creature.url,
      description: `${creature.name.eng} • ${creature.challengeRailing}`,
    };
  }

  const { data, status, refresh } = await useAsyncData<
    Array<CreatureSearchItem>
  >(
    () => `initiative-creature-search:${searchQuery.value}`,
    async () => {
      if (searchQuery.value.length < CREATURE_SEARCH_MIN_LENGTH) {
        return [];
      }

      const response = await $fetch<unknown>(
        INITIATIVE_TRACKER_ENDPOINTS.bestiarySearch,
        {
          method: 'GET',
          query: {
            search: searchQuery.value,
            page: 0,
            size: CREATURE_SEARCH_PAGE_SIZE,
          },
        },
      );

      return normalizeCreatureSearch(
        creatureSearchResponseSchema.parse(response),
      ).value.map(createCreatureSearchItem);
    },
    {
      watch: [searchQuery],
      default: () => [],
      lazy: true,
    },
  );

  const items = computed(() => data.value ?? []);

  const handleDropdownOpening = useDebounceFn(async (open: boolean) => {
    if (!open) {
      return;
    }

    await refresh();
  }, 250);
</script>

<template>
  <USelectMenu
    v-model="model"
    v-model:search-term="search"
    :items
    :loading="status === 'pending'"
    value-key="value"
    label-key="label"
    placeholder="Найти существо"
    searchable
    clearable
    ignore-filter
    @update:open="handleDropdownOpening"
  >
  </USelectMenu>
</template>
