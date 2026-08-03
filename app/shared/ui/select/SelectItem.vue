<script setup lang="ts">
  import type { ItemLinkResponse } from '~items/model';

  import { z } from '~/utils/zod';

  import {
    ITEM_DETAIL_ENDPOINT_PREFIX,
    ITEMS_SEARCH_ENDPOINT,
    SELECT_DROPDOWN_DEBOUNCE_MS,
  } from './constants';

  interface ItemSelectItem {
    label: string;
    value: string;
    description: string;
    source: string;
  }

  /** Схема детали предмета: из неё собирается опция уже выбранного предмета. */
  const itemDetailSchema = z.object({
    url: z.string(),
    name: z.object({
      rus: z.string().catch(''),
      eng: z.string().catch(''),
    }),
    source: z
      .object({ name: z.object({ label: z.string().catch('') }) })
      .nullable()
      .catch(null),
  });

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
  const searchQuery = refDebounced(search, SELECT_DROPDOWN_DEBOUNCE_MS);

  const excludeKey = computed<string>(() => props.excludeUrls.join(','));

  /** Выбранные предметы: у одиночного селекта — не больше одного. */
  const selectedUrls = computed<Array<string>>(() => {
    if (Array.isArray(model.value)) {
      return model.value.filter(Boolean);
    }

    return model.value ? [model.value] : [];
  });

  /** Приводит ссылку или деталь предмета к опции селекта. */
  function toSelectItem(item: {
    url: string;
    name: { rus: string; eng: string };
    source: { name: { label: string } } | null;
  }): ItemSelectItem {
    return {
      label: item.name.rus,
      value: item.url,
      description: item.name.eng,
      source: item.source?.name.label ?? '',
    };
  }

  // Ключ уникален для каждого экземпляра: на одной странице селектов предметов
  // может быть несколько (например, строки стартового снаряжения класса), и общий
  // ключ означал бы общее состояние useAsyncData — ответ соседнего селекта,
  // запрошенный без поисковой строки, затирал бы отфильтрованный список.
  const instanceId = useId();

  const asyncDataKey = computed<string>(
    () => `items-select:${instanceId}:${excludeKey.value}`,
  );

  const { data, status, refresh } = await useAsyncData<Array<ItemSelectItem>>(
    asyncDataKey,
    async () => {
      const itemLinks = await $fetch<Array<ItemLinkResponse>>(
        ITEMS_SEARCH_ENDPOINT,
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
        .map(toSelectItem);
    },
    {
      watch: [searchQuery, excludeKey],
      // cancel, а не defer: при defer запрос с новой поисковой строкой просто
      // отбрасывается, если предыдущий ещё в полёте, и список остаётся нефильтрованным.
      dedupe: 'cancel',
      lazy: true,
      // Список подтягивается на открытии выпадашки (`refresh` ниже), а не на
      // монтаже: в форме класса таких селектов полтора десятка, и запрашивать
      // один и тот же справочник на каждый ряд незачем. Подпись уже выбранного
      // предмета от этого не зависит — её даёт догрузка детали.
      default: () => [],
    },
  );

  // Опции выбранных предметов, догруженные деталью. Без них `USelectMenu` не
  // находит выбранный url среди опций и показывает вместо названия сам слаг
  // («shield-phb»), пока выдача поиска не подъедет и не накроет его.
  const resolvedSelectedItems = ref<Array<ItemSelectItem>>([]);

  // Url, по которым запрос уже уходил: и удачный, и неудачный. Иначе предмет,
  // детали которого не отдались, запрашивался бы на каждую правку списка.
  const requestedUrls = new Set<string>();

  const selectItems = computed<Array<ItemSelectItem>>(() => {
    const loadedUrls = new Set(data.value.map((item) => item.value));

    const missingSelected = resolvedSelectedItems.value.filter(
      (item) =>
        selectedUrls.value.includes(item.value) && !loadedUrls.has(item.value),
    );

    return [...missingSelected, ...data.value];
  });

  /** Деталь предмета опцией селекта; null — ответ не пришёл или не разобран. */
  async function fetchSelectedItem(
    itemUrl: string,
  ): Promise<ItemSelectItem | null> {
    try {
      const response = await $fetch<unknown>(
        `${ITEM_DETAIL_ENDPOINT_PREFIX}/${itemUrl}`,
        { method: 'get', retry: 0 },
      );

      const parsed = itemDetailSchema.safeParse(response);

      return parsed.success ? toSelectItem(parsed.data) : null;
    } catch {
      return null;
    }
  }

  /** Догружает выбранные предметы, которых нет в текущей выдаче поиска. */
  async function loadMissingSelectedItems(): Promise<void> {
    const loadedUrls = new Set(data.value.map((item) => item.value));

    const missingUrls = selectedUrls.value.filter(
      (itemUrl) => !loadedUrls.has(itemUrl) && !requestedUrls.has(itemUrl),
    );

    if (!missingUrls.length) {
      return;
    }

    for (const itemUrl of missingUrls) {
      requestedUrls.add(itemUrl);
    }

    const loadedItems = await Promise.all(missingUrls.map(fetchSelectedItem));

    resolvedSelectedItems.value = [
      ...resolvedSelectedItems.value,
      ...loadedItems.filter((item): item is ItemSelectItem => item !== null),
    ];
  }

  // Один watcher на оба источника: догрузка нужна и когда пришло значение
  // формы, и когда выдача поиска сменилась и выбранный предмет из неё выпал.
  // Цикла нет: обработчик пишет только в `resolvedSelectedItems`.
  watch([selectedUrls, data], () => void loadMissingSelectedItems(), {
    immediate: true,
  });

  const handleDropdownOpening = useDebounceFn(async (state: boolean) => {
    if (!state) {
      return;
    }

    await refresh();
  }, SELECT_DROPDOWN_DEBOUNCE_MS);

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
    :items="selectItems"
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
        v-if="item.source"
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
