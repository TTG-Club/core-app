<script setup lang="ts">
  import type { FeatLinkResponse } from '~/shared/types';
  import { debounce } from 'lodash-es';
  import { onBeforeUnmount, ref } from 'vue';

  type FeatSelectItem = {
    label: string;
    value: string;
    description: string;
    source: string;
  };

  export type FeatCategory =
    | 'ORIGIN'
    | 'GENERAL'
    | 'EPIC_BOON'
    | 'FIGHTING_STYLE'
    | 'DRAGONMARK';

  export type FeatCategoryOption = {
    value: FeatCategory;
    label: string;
  };

  type Props = {
    disabled?: boolean;
    multiple?: boolean;

    /**
     * Значения категорий, которые могут быть выбраны.
     */
    selectedCategories?: Array<FeatCategory>;

    /**
     * (Опционально) список категорий с лейблами.
     * Если не передан — фильтр не отправляется.
     */
    categories?: Array<FeatCategoryOption>;
  };

  const props = withDefaults(defineProps<Props>(), {
    selectedCategories: () => [],
    categories: () => [],
  });

  const model = defineModel<string | Array<string>>();

  const searchQuery = ref('');
  const openedOnce = ref(false);

  type FetchOpts = Parameters<typeof $fetch>[1];

  const buildFetchOptions = (): FetchOpts => {
    const base: FetchOpts = {
      method: 'post',
      query: {
        query: searchQuery.value || undefined,
      },
    };

    if (
      props.selectedCategories.length === 0 ||
      props.categories.length === 0
    ) {
      return base;
    }

    const selectedSet = new Set(props.selectedCategories);

    return {
      ...base,
      body: {
        filter: {
          groups: [
            {
              key: 'club.ttg.dnd5.domain.feat.rest.dto.filter.FeatCategoryFilterGroup',
              name: 'Категории',
              filters: props.categories.map((opt) => ({
                key: '.FeatCategoryFilterGroup$FeatCategoryFilterItem',
                value: opt.value,
                name: opt.label,
                selected: selectedSet.has(opt.value) ? true : null,
              })),
            },
          ],
          version: '1.0',
        },
      },
    } as FetchOpts;
  };

  const { data, status, refresh } = await useAsyncData<Array<FeatSelectItem>>(
    'feat-select',
    async () => {
      const featLinks = await $fetch<Array<FeatLinkResponse>>(
        '/api/v2/feats/search',
        buildFetchOptions(),
      );

      return featLinks.map((feat) => ({
        label: feat.name.rus,
        value: feat.url,
        description: feat.name.eng,
        source: feat.source.name.label,
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

  // debounce из lodash-es — ровно для этого кейса
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
    :multiple="props.multiple ?? false"
    :disabled="props.disabled"
    placeholder="Выбери черту"
    label-key="label"
    value-key="value"
    ignore-filter
    searchable
    clearable
    :filter="false"
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
