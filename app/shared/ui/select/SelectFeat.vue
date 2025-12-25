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

  const {
    disabled = false,
    multiple = false,
    categories = undefined,
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    categories?: Array<string>;
  }>();

  const model = defineModel<string | Array<string>>();

  const search = shallowRef('');
  const searchQuery = refDebounced(search, 250);

  const categoriesKey = computed(() => (categories ?? []).join('|'));

  const fetchKey = computed(() => {
    const base = 'feat-select-v2';

    const queryPart =
      searchQuery.value && searchQuery.value.length >= 2
        ? `-q:${searchQuery.value}`
        : '';

    const categoriesPart =
      categories && categories.length > 0
        ? `-c:${categories.join('-').toLowerCase()}`
        : '';

    return `${base}${queryPart}${categoriesPart}`;
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
              categories && categories.length > 0 ? categories : undefined,
            query:
              searchQuery.value.length >= 2 ? searchQuery.value : undefined,
          },
        },
      );

      return featLinks.map((feat) => {
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
      watch: [searchQuery, categoriesKey],
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
