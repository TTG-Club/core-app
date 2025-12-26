<script setup lang="ts">
  type FeatSelectResponse = {
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
  };

  type FeatSelectItem = {
    label: string;
    value: string;
    description: string;
    source: string;
    category: string;
    prerequisite: string | null;
    repeatability: boolean;
    abilities: Array<string>;
    increase: number | null;
  };

  const props = withDefaults(
    defineProps<{
      disabled?: boolean;
      multiple?: boolean;
      categories?: Array<string>;
      excludeUrls?: Array<string>;
    }>(),
    {
      disabled: false,
      multiple: false,
      categories: undefined,
      excludeUrls: () => [],
    },
  );

  const model = defineModel<string | Array<string>>();

  const search = shallowRef('');
  const searchQuery = refDebounced(search, 250);

  const categoriesKey = computed(() => (props.categories ?? []).join('|'));
  const excludeKey = computed(() => props.excludeUrls.join('|'));

  const fetchKey = computed(() => {
    const base = 'feat-select-v2';

    const queryPart =
      searchQuery.value && searchQuery.value.length >= 2
        ? `-q:${searchQuery.value}`
        : '';

    const categoriesPart =
      props.categories && props.categories.length > 0
        ? `-c:${props.categories.join('-').toLowerCase()}`
        : '';

    const excludePart =
      props.excludeUrls.length > 0
        ? `-x:${props.excludeUrls.join('-').toLowerCase()}`
        : '';

    return `${base}${queryPart}${categoriesPart}${excludePart}`;
  });

  const { data, status, refresh } = await useAsyncData<Array<FeatSelectItem>>(
    fetchKey,
    async () => {
      const featLinks = await $fetch<Array<FeatSelectResponse>>(
        '/api/v2/feats/select',
        {
          method: 'get',
          query: {
            categories:
              props.categories && props.categories.length > 0
                ? props.categories
                : undefined,
            query:
              searchQuery.value.length >= 2 ? searchQuery.value : undefined,
          },
        },
      );

      const excluded = new Set(props.excludeUrls);

      return featLinks
        .filter((feat) => {
          if (!excluded.has(feat.url)) {
            return true;
          }

          // если значение уже выбрано — оставляем его видимым
          if (typeof model.value === 'string') {
            return model.value === feat.url;
          }

          if (Array.isArray(model.value)) {
            return model.value.includes(feat.url);
          }

          return false;
        })
        .map((feat) => {
          const sourceLabel = feat.source.name.label;

          const altNames = feat.name.alt ?? [];
          const alt = altNames.length > 0 ? ` • ${altNames.join(', ')}` : '';

          const prerequisiteText = feat.prerequisite
            ? ` • ${feat.prerequisite}`
            : '';

          return {
            label: feat.name.rus,
            value: feat.url,
            description: `${feat.name.eng}${alt}${prerequisiteText}`,
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
      watch: [searchQuery, categoriesKey, excludeKey],
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
    :multiple="props.multiple"
    :disabled="props.disabled"
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
