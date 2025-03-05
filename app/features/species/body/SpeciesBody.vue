<script setup lang="ts">
  import type { SpeciesDetailResponse } from '~/shared/types';
  import { SpeciesLineages } from '../lineages';

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
    <ATypographyText
      v-if="species.description"
      :content="species.description"
      :style="{ whiteSpace: 'pre-wrap' }"
      data-allow-mismatch
    />

    <ACollapse
      v-for="feature in species.features"
      :key="feature.url"
      v-model:active-key="activeFeatures"
      expand-icon-position="end"
      :bordered="false"
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
          <ATypographyText
            :content="feature.description"
            :style="{ whiteSpace: 'pre-wrap' }"
            data-allow-mismatch
          />
        </template>
      </ACollapsePanel>
    </ACollapse>

    <SpeciesLineages
      v-if="!species.parent && species.hasLineages"
      :url="species.url"
    />
  </AFlex>
</template>
