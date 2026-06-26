<script setup lang="ts">
  import type { ItemLinkResponse } from '~items/model';

  interface ItemSelectItem {
    label: string;
    value: string;
    description: string;
    source: string;
  }

  const props = withDefaults(
    defineProps<{
      disabled?: boolean;
      multiple?: boolean;
      excludeUrls?: Array<string>;
    }>(),
    {
      disabled: false,
      multiple: false,
      excludeUrls: () => [],
    },
  );

  // IMPORTANT:
  // USelectMenu при clearable может эмитить null.
  // Внизу нормализуем null -> '' (а не даём ему попасть в model).
  const model = defineModel<string | Array<string>>();

  const search = ref('');
  const searchQuery = refDebounced(search, 250);

  const excludeKey = computed<string>(() => props.excludeUrls.join(','));

  const asyncDataKey = computed<string>(
    () => `items-select:${excludeKey.value}`,
  );

  const { data, status, refresh } = await useAsyncData<Array<ItemSelectItem>>(
    asyncDataKey,
    async () => {
      const itemLinks = await $fetch<Array<ItemLinkResponse>>(
        '/api/v2/item/search',
        {
          method: 'get',
          query: {
            search:
              searchQuery.value.length >= 2 ? searchQuery.value : undefined,
          },
        },
      );

      const excluded = new Set(props.excludeUrls);

      return itemLinks
        .filter((itemLink) => {
          if (!excluded.has(itemLink.url)) {
            return true;
          }

          // если значение уже выбрано — оставляем его видимым
          if (typeof model.value === 'string') {
            return model.value === itemLink.url;
          }

          if (Array.isArray(model.value)) {
            return model.value.includes(itemLink.url);
          }

          return false;
        })
        .map((itemLink) => ({
          label: itemLink.name.rus,
          value: itemLink.url,
          description: itemLink.name.eng,
          source: itemLink.source.name.label,
        }));
    },
    {
      watch: [searchQuery, excludeKey],
      dedupe: 'defer',
      lazy: true,
      default: () => [],
    },
  );

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
      model.value = props.multiple ? [] : '';

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
    :items="data"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери предмет${multiple ? 'ы' : ''}`"
    label-key="label"
    value-key="value"
    ignore-filter
    searchable
    clearable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
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
