<script setup lang="ts">
  import { SpeciesLineages } from '~species/lineages';
  import { MarkupRender } from '~ui/markup';
  import { UiCollapse } from '~ui/collapse';

  import type { SpeciesDetailResponse } from '~/shared/types';

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
  <div class="flex flex-col gap-6">
    <div>
      <MarkupRender
        v-if="species.description"
        :entries="species.description"
      />
    </div>

    <template v-if="species.features">
      <UiCollapse
        v-for="feature in species.features"
        :id="feature.url"
        :key="feature.url"
        default-open
      >
        <template #default>
          {{ feature.name.rus }}
        </template>

        <template #content>
          <MarkupRender :entries="feature.description" />
        </template>
      </UiCollapse>
    </template>

    <SpeciesLineages
      v-if="!species.parent && species.hasLineages"
      :url="species.url"
    />
  </div>
</template>
