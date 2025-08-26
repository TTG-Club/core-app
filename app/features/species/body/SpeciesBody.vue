<script setup lang="ts">
  import { SpeciesLineages } from '~species/lineages';
  import { MarkupRender } from '~ui/markup';
  import { UiCollapse } from '~ui/collapse';
  import { UiGallery } from '~ui/gallery';
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';
  import StatsBlock from './ui/StatsBlock.vue';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const { species, hideGallery = false } = defineProps<{
    species: SpeciesDetailResponse;
    hideGallery?: boolean;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(SpeciesLineagesDrawer, {
    destroyOnClose: true,
  });

  function openLineages(speciesUrl: string) {
    drawer.open({
      url: speciesUrl,
      onClose: () => drawer.close(),
    });
  }

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
  <div class="@container">
    <div class="flex flex-col gap-6 @min-[800px]:flex-row @min-[800px]:gap-7">
      <div class="flex w-full flex-col gap-4 @min-[800px]:max-w-80">
        <template v-if="!hideGallery">
          <UiGallery
            :preview="species.image"
            :images="species.gallery"
          />
        </template>

        <StatsBlock
          :type-value="species.properties.type"
          :size="species.properties.size"
          :speed="species.properties.speed"
        />

        <UButton
          v-if="species.hasLineages"
          block
          @click.left.exact.prevent="openLineages(species.url)"
        >
          Происхождения
        </UButton>
      </div>

      <div class="flex flex-auto flex-col gap-6">
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
    </div>
  </div>
</template>
