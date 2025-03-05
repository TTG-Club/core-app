<script setup lang="ts">
  import type { SpecieDetailResponse } from '~/shared/types';
  import { SpeciesBody } from '../body';

  const { url } = defineProps<{
    url: SpecieDetailResponse['url'];
  }>();

  const { data: lineages } = await useAsyncData(`species-lineages-${url}`, () =>
    $fetch<Array<SpecieDetailResponse>>(`/api/v2/species/lineages/${url}`),
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
      v-for="specie in lineages"
      :key="specie.url"
      :bordered="false"
      expand-icon-position="end"
    >
      <ACollapsePanel>
        <template #header>
          <ATypographyTitle
            :level="4"
            data-allow-mismatch
          >
            {{ specie.name.rus }}
          </ATypographyTitle>
        </template>

        <template #default>
          <SpeciesBody :specie />
        </template>
      </ACollapsePanel>
    </ACollapse>
  </AFlex>
</template>
