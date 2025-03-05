<script setup lang="ts">
  import type { SpecieDetailResponse } from '~/shared/types';
  import { SpecieLineages } from '../lineages';

  const { specie } = defineProps<{
    specie: SpecieDetailResponse;
  }>();

  const activeFeatures = ref<Array<string>>([]);

  watch(
    () => specie,
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
      v-if="specie.description"
      :content="specie.description"
      :style="{ whiteSpace: 'pre-wrap' }"
      data-allow-mismatch
    />

    <ACollapse
      v-for="feature in specie.features"
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

    <SpecieLineages
      v-if="!specie.parent && specie.hasLineages"
      :url="specie.url"
    />
  </AFlex>
</template>
