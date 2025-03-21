<script setup lang="ts">
  import type { SpeciesDetailResponse } from '~/shared/types';
  import { SpeciesLineages } from '~species/lineages';
  import { MarkupRender } from '~ui/markup';

  const { species } = defineProps<{
    species: SpeciesDetailResponse;
  }>();

  const activeFeatures = ref<Array<string>>([]);

  watch(
    () => species,
    (value) => {
      if (!value) {
        return;
      }

      if (!value.features) {
        activeFeatures.value = [];

        return;
      }

      activeFeatures.value = value.features.map((feature) => feature.url);
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <AFlex
    :gap="16"
    vertical
  >
    <MarkupRender
      v-if="species.description"
      :entries="species.description"
    />

    <template v-if="species.features">
      <ACollapse
        v-for="feature in species.features"
        :key="feature.url"
        v-model:active-key="activeFeatures"
        :bordered="false"
        expand-icon-position="end"
        destroy-inactive-panel
      >
        <ACollapsePanel
          :id="feature.url"
          :key="feature.url"
          data-allow-mismatch
        >
          <template #header>
            <ATypographyTitle
              :level="4"
              data-allow-mismatch
            >
              {{ feature.name.rus }}
            </ATypographyTitle>
          </template>

          <template #default>
            <MarkupRender :entries="feature.description" />
          </template>
        </ACollapsePanel>
      </ACollapse>
    </template>

    <SpeciesLineages
      v-if="!species.parent && species.hasLineages"
      :url="species.url"
    />
  </AFlex>
</template>
