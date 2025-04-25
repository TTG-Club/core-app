<script setup lang="ts">
  import { SpeciesBody } from '~species/body';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const { url } = defineProps<{
    url: SpeciesDetailResponse['url'];
  }>();

  const { data: lineages } = await useAsyncData(`species-${url}-lineages`, () =>
    $fetch<Array<SpeciesDetailResponse>>(`/api/v2/species/${url}/lineages`),
  );
</script>

<template>
  <AFlex
    v-if="lineages?.length"
    gap="16"
    vertical
  >
    <ATypographyTitle
      :level="3"
      content="Происхождения"
    />

    <ACollapse
      v-for="species in lineages"
      :key="species.url"
      :bordered="false"
      expand-icon-position="end"
    >
      <ACollapsePanel>
        <template #header>
          <ATypographyTitle
            :level="4"
            data-allow-mismatch
          >
            {{ species.name.rus }}
          </ATypographyTitle>
        </template>

        <template #default>
          <SpeciesBody :species />
        </template>
      </ACollapsePanel>
    </ACollapse>
  </AFlex>
</template>
