<script setup lang="ts">
  import type { FeatLinkResponse } from '~/shared/types';

  type FeatSelectItem = {
    label: string;
    value: string;
    description: string;
    source: string;
  };

  export type FeatCategoryOption = {
    value: string;
    label: string;
  };

  const props = withDefaults(
    defineProps<{
      disabled?: boolean;
      multiple?: boolean;

      /**
       * Значения категорий, которые должны быть выбраны.
       * Пример: ['ORIGIN'].
       */
      selectedCategories?: Array<string>;

      /**
       * (Опционально) список категорий с лейблами.
       * Если не передан — фильтр всё равно может применяться по selectedCategories.
       */
      categories?: Array<FeatCategoryOption>;
    }>(),
    {
      selectedCategories: () => [],
      categories: () => [],
    },
  );

  const model = defineModel<string | Array<string>>();

  const searchQuery = ref('');
  const openedOnce = ref(false);

  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  const defaultCategories: Array<FeatCategoryOption> = [
    { value: 'ORIGIN', label: 'черта происхождения' },
    { value: 'GENERAL', label: 'общая черта' },
    { value: 'EPIC_BOON', label: 'эпическая черта' },
    { value: 'FIGHTING_STYLE', label: 'боевой стиль' },
    { value: 'DRAGONMARK', label: 'метка дракона' },
  ];

  const categoryOptions = computed<Array<FeatCategoryOption>>(() => {
    if (props.categories.length > 0) {
      return props.categories;
    }

    // Нужны лейблы для body.filter.filters[].name
    return defaultCategories;
  });

  const selectedSet = computed(() => new Set(props.selectedCategories));

  const shouldSendFilterBody = computed(() => {
    // Тело отправляем, только если реально нужен фильтр
    return props.selectedCategories.length > 0;
  });

  const buildFetchOptions = () => {
    const base = {
      method: 'post' as const,
      query: {
        query: searchQuery.value || undefined,
      },
    };

    // Если selectedCategories не заданы — не отправляем body
    if (!shouldSendFilterBody.value) {
      return base;
    }

    // selectedCategories заданы — отправляем body.filter (даже если categories не передали)
    return {
      ...base,
      body: {
        filter: {
          groups: [
            {
              key: 'club.ttg.dnd5.domain.feat.rest.dto.filter.FeatCategoryFilterGroup',
              name: 'Категории',
              filters: categoryOptions.value.map((opt) => ({
                key: '.FeatCategoryFilterGroup$FeatCategoryFilterItem',
                value: opt.value,
                name: opt.label,
                selected: selectedSet.value.has(opt.value) ? true : null,
              })),
            },
          ],
          version: '1.0',
        },
      },
    };
  };

  const { data, status, refresh } = await useAsyncData<Array<FeatSelectItem>>(
    () => {
      const filterKey = shouldSendFilterBody.value
        ? `sel:${props.selectedCategories.join(',')}`
        : 'nofilter';

      return `feat-select:${searchQuery.value}:${filterKey}`;
    },
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
