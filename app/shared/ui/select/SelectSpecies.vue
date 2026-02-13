<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~species/model';

  interface SpeciesSelectItem {
    label: string;
    value: string;
    description: string;
    source: string;
  }

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData<SpeciesSelectItem[]>(
    'species-select',
    async () => {
      const speciesLinks = await $fetch<Array<SpeciesLinkResponse>>(
        '/api/v2/species/search',
        {
          method: 'post',
        },
      );

      return speciesLinks.map((species) => ({
        label: species.name.rus,
        value: species.url,
        description: species.name.eng,
        source: species.source.name.label,
      }));
    },
    {
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
    :loading="status === 'pending'"
    :items="data"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери вид${multiple ? 'ы' : ''}`"
    label-key="label"
    value-key="value"
    clearable
    searchable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
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
