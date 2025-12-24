<script setup lang="ts">
  import type { FeatLinkResponse } from '~/shared/types';
  import { cloneDeep, isEmpty, isString } from 'lodash-es';
  import type { Filter } from '~filter/types';

  const {
    disabled = false,
    multiple = false,
    categories = undefined,
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    /**
     * (Опционально) список категорий.
     * Если не передан — фильтр не отправляется.
     */
    categories?: Array<string>;
  }>();

  const model = defineModel<string | Array<string>>();

  const search = shallowRef('');
  const searchQuery = refDebounced(search, 250);

  const { data: filterData } = await useAsyncData(
    'feats-filter',
    () => $fetch<Filter>('/api/v2/feats/filters'),
    {
      deep: false,
    },
  );

  const filter = computed(() => {
    if (!categories?.length || !filterData.value) {
      return undefined;
    }

    const modifiedFilter = cloneDeep(filterData.value);

    const categoriesGroup = modifiedFilter.groups.find(
      (group) =>
        group.key ===
        'club.ttg.dnd5.domain.feat.rest.dto.filter.FeatCategoryFilterGroup',
    );

    if (!categoriesGroup) {
      return undefined;
    }

    categoriesGroup.filters = categoriesGroup.filters.map((filterItem) => ({
      ...filterItem,
      selected:
        isString(filterItem.value) && categories.includes(filterItem.value)
          ? true
          : null,
    }));

    return {
      filter: modifiedFilter,
    };
  });

  const fetchKey = computed(() => {
    let key = 'feat-select';

    if (searchQuery.value) {
      key += `-${searchQuery.value}`;
    }

    if (!isEmpty(categories?.length)) {
      key += `-${categories?.join('-').toLowerCase()}`;
    }

    return key;
  });

  const { data, status, refresh } = await useAsyncData(
    fetchKey,
    async () => {
      const featLinks = await $fetch<Array<FeatLinkResponse>>(
        '/api/v2/feats/search',
        {
          method: 'post',
          query: {
            query:
              searchQuery.value.length >= 2 ? searchQuery.value : undefined,
          },
          body: filter.value || undefined,
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
    v-model:search-term="search"
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
