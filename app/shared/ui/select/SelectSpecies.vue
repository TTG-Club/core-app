<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'species-select',
    async () => {
      const speciesLinks = await $fetch<Array<SpeciesLinkResponse>>(
        '/api/v2/species/search',
        {
          method: 'post',
        },
      );

      return speciesLinks.map((species) => ({
        label: `${species.name.rus} [${species.name.eng}]`,
        value: species.url,
      }));
    },
    { dedupe: 'defer' },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <USelect
    v-model="model"
    :loading="status === 'pending'"
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    placeholder="Выбери вид"
    clearable
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
