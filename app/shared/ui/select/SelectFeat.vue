<script setup lang="ts">
  interface FeatSelectResponse {
    url: string;
    category: string;
    prerequisite: string | null;
    repeatability: boolean;
    abilities: Array<string> | null;
    increase: number | null;
    source: {
      name: {
        label: string;
        rus?: string;
        eng?: string;
      };
      group?: {
        label: string;
        rus?: string;
      };
      page: number | null;
    };
    name: {
      rus: string;
      eng: string;
      alt?: Array<string> | null;
    };
  }

  interface FeatSelectItem {
    label: string;
    value: string;
    description: string;
    source: string;
    category: string;
    prerequisite: string | null;
    repeatability: boolean;
    abilities: Array<string>;
    increase: number | null;
  }

  const props = withDefaults(
    defineProps<{
      disabled?: boolean;
      multiple?: boolean;
      categories?: Array<string>;
      excludeUrls?: Array<string>;
      /**
       * Идентификаторы разрешённых источников (`['PHB']`). Эндпоинт `/select`
       * по источникам не фильтрует, поэтому отбор идёт на клиенте. Пустой
       * список означает, что ограничения нет.
       */
      sources?: Array<string>;
      max?: number;
    }>(),
    {
      disabled: false,
      multiple: false,
      categories: undefined,
      excludeUrls: () => [],
      sources: () => [],
      max: undefined,
    },
  );

  // IMPORTANT:
  // USelectMenu при clearable может эмитить null.
  // Мы внизу нормализуем null -> '' (а не даём ему попасть в model).
  const model = defineModel<string | Array<string>>();

  const search = ref('');
  const searchQuery = refDebounced(search, 250);

  const categoriesList = computed<Array<string>>(() => props.categories ?? []);
  const categoriesKey = computed<string>(() => categoriesList.value.join(','));

  const excludeKey = computed<string>(() => props.excludeUrls.join(','));

  const sourcesKey = computed<string>(() => props.sources.join(','));

  /** Черта уже выбрана в модели (одиночный или множественный выбор). */
  function isSelectedUrl(featUrl: string): boolean {
    if (typeof model.value === 'string') {
      return model.value === featUrl;
    }

    if (Array.isArray(model.value)) {
      return model.value.includes(featUrl);
    }

    return false;
  }

  const requestCategories = computed<string | undefined>(() => {
    if (categoriesList.value.length === 0) {
      return undefined;
    }

    return categoriesList.value.join(',');
  });

  const asyncDataKey = computed<string>(() => {
    return `feats-select:${categoriesKey.value}:${excludeKey.value}:${sourcesKey.value}`;
  });

  const { data, status, refresh } = await useAsyncData<Array<FeatSelectItem>>(
    asyncDataKey,
    async () => {
      const featLinks = await $fetch<Array<FeatSelectResponse>>(
        '/api/v2/feats/select',
        {
          method: 'get',
          query: {
            categories: requestCategories.value,
            query:
              searchQuery.value.length >= 2 ? searchQuery.value : undefined,
          },
        },
      );

      const excluded = new Set(props.excludeUrls);
      const allowedSources = new Set(props.sources);

      return featLinks
        .filter((feat) => {
          // если значение уже выбрано — оставляем его видимым
          if (isSelectedUrl(feat.url)) {
            return true;
          }

          if (
            allowedSources.size > 0
            && !allowedSources.has(feat.source.name.label)
          ) {
            return false;
          }

          return !excluded.has(feat.url);
        })
        .map((feat) => {
          const sourceLabel = feat.source.name.label;

          const altNames = feat.name.alt ?? [];
          const alt = altNames.length > 0 ? ` • ${altNames.join(', ')}` : '';

          return {
            label: feat.name.rus,
            value: feat.url,
            description: `${feat.name.eng}${alt}`,
            source: sourceLabel,
            category: feat.category,
            prerequisite: feat.prerequisite,
            repeatability: feat.repeatability,
            abilities: feat.abilities ?? [],
            increase: feat.increase,
          };
        });
    },
    {
      watch: [searchQuery, categoriesKey, excludeKey, sourcesKey],
      dedupe: 'defer',
      lazy: true,
      default: () => [],
    },
  );

  const items = computed<Array<FeatSelectItem>>(() => {
    const list = data.value ?? [];

    if (
      props.max
      && Array.isArray(model.value)
      && model.value.length >= props.max
    ) {
      return list.map((item) => ({
        ...item,
        disabled: !model.value?.includes(item.value),
      }));
    }

    return list;
  });

  const handleDropdownOpening = useDebounceFn(async (state: boolean) => {
    if (!state) {
      return;
    }

    await refresh();
  }, 250);

  function handleModelValueUpdate(
    value: string | Array<string> | null | undefined,
  ): void {
    if (value === null || value === undefined) {
      // нормализация "очистки" в пустое значение, без null
      model.value = '';

      return;
    }

    model.value = value;
  }
</script>

<template>
  <USelectMenu
    v-model:search-term="search"
    :model-value="model"
    :loading="status === 'pending'"
    :items
    :multiple
    :disabled
    placeholder="Выбери черту"
    label-key="label"
    value-key="value"
    ignore-filter
    searchable
    clearable
    @update:open="handleDropdownOpening"
    @update:model-value="handleModelValueUpdate"
  >
    <template #item-trailing="{ item }">
      <UBadge
        variant="subtle"
        color="neutral"
      >
        {{ item.source }}
      </UBadge>
    </template>

    <template #item-description="{ item }">
      <div
        class="w-full truncate"
        :title="item.description"
      >
        {{ item.description }}
      </div>
    </template>
  </USelectMenu>
</template>
