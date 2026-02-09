<script setup lang="ts">
  import { debounce } from 'es-toolkit';

  import type { BackgroundSelectResponse } from '~/shared/types';

  interface BackgroundSelectItem {
    label: string;
    value: string;
    description: string;
    sourceLabel: string;
  }

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  // IMPORTANT:
  // USelectMenu при clearable может эмитить null.
  // Мы внизу нормализуем null -> undefined (а не даём ему попасть в model).
  const model = defineModel<string | undefined>({ default: undefined });

  const searchQuery = ref<string>('');
  const openedOnce = ref<boolean>(false);

  const { data, status, refresh } = await useAsyncData<
    Array<BackgroundSelectItem>
  >(
    'backgrounds-select',
    async () => {
      const backgroundsLinks = await $fetch<Array<BackgroundSelectResponse>>(
        '/api/v2/backgrounds/select',
        {
          method: 'get',
          query: {
            query: searchQuery.value || undefined,
          },
        },
      );

      return backgroundsLinks.map((backgroundLink) => ({
        label: backgroundLink.name.rus,
        value: backgroundLink.url,
        description: backgroundLink.name.eng,
        sourceLabel: backgroundLink.source.name.label,
      }));
    },
    { dedupe: 'defer' },
  );

  async function handleDropdownOpening(state: boolean) {
    if (!state || openedOnce.value) {
      return;
    }

    openedOnce.value = true;
    await refresh();
  }

  const debouncedRefresh = debounce(() => {
    refresh();
  }, 250);

  onBeforeUnmount(() => {
    debouncedRefresh.cancel();
  });

  function handleSearch(value: string) {
    searchQuery.value = value;

    if (!openedOnce.value) {
      return;
    }

    debouncedRefresh();
  }

  function handleModelValueUpdate(value: string | string[]): void {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      // нормализация "очистки" в undefined, без null или пустой строки
      model.value = undefined;

      return;
    }

    // Для single select берем первый элемент массива, если пришел массив
    model.value = Array.isArray(value) ? value[0] : value;
  }
</script>

<template>
  <USelectMenu
    :model-value="model"
    :loading="status === 'pending'"
    :items="data"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери предыстори${multiple ? 'и' : 'ю'}`"
    label-key="label"
    value-key="value"
    ignore-filter
    clearable
    searchable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
    @update:search-term="handleSearch"
    @update:open="handleDropdownOpening"
    @update:model-value="handleModelValueUpdate"
  >
    <template #item-trailing="{ item }">
      <UBadge
        variant="subtle"
        color="neutral"
      >
        {{ item.sourceLabel }}
      </UBadge>
    </template>
  </USelectMenu>
</template>
