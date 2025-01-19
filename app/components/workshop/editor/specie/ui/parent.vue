<script setup lang="ts">
  import type { SpecieLink } from '#shared/types/character/species';

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'species-select',
    async () => {
      const specieLinks = await $fetch<Array<SpecieLink>>(
        '/api/v2/species/search',
        {
          method: 'post',
        },
      );

      return specieLinks.map((specie) => ({
        label: `${specie.name.rus} [${specie.name.eng}]`,
        value: specie.url,
      }));
    },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <ASelect
    v-model:value="model"
    :loading="status === 'pending'"
    :options="data || []"
    placeholder="Выбери основной вид"
    show-search
    allow-clear
    @dropdown-visible-change="handleDropdownOpening($event)"
  />
</template>
