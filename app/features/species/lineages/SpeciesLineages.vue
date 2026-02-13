<script setup lang="ts">
  import { SpeciesBody } from '~species/body';
  import { UiCollapse } from '~ui/collapse';

  import type { SpeciesDetailResponse } from '~species/model';

  const { url } = defineProps<{
    url: SpeciesDetailResponse['url'];
  }>();

  const { data: lineages } = await useAsyncData(`species-${url}-lineages`, () =>
    $fetch<Array<SpeciesDetailResponse>>(`/api/v2/species/${url}/lineages`),
  );
</script>

<template>
  <div
    v-if="lineages?.length"
    class="flex flex-col gap-4"
  >
    <h3 class="text-xl font-semibold">Происхождения</h3>

    <UiCollapse
      v-for="species in lineages"
      :key="species.url"
    >
      <template #default>
        {{ species.name.rus }}
      </template>

      <template #content>
        <SpeciesBody
          :species
          hide-left-block
        />
      </template>
    </UiCollapse>
  </div>
</template>
