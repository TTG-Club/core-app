<script setup lang="ts">
  import { SpeciesLineages } from '~species/lineages';
  import { MarkupRender } from '~ui/markup';
  import { UiCollapse } from '~ui/collapse';
  import { UiGallery } from '~ui/gallery';
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const props = withDefaults(
    defineProps<{
      species: SpeciesDetailResponse;
    }>(),
    {},
  );

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
    () => props.species,
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
  <div class="flex flex-col gap-6 @min-[800px]:flex-row @min-[800px]:gap-7">
    <div class="flex w-full flex-col gap-4 @min-[800px]:max-w-80">
      <template>
        <UiGallery
          :preview="props.species.image"
          :images="props.species.gallery"
        />

        <div
          class="w-full overflow-hidden rounded-lg border border-default bg-muted py-1.5"
        >
          <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
            <span class="min-w-20 text-sm font-medium text-highlighted"
              >Тип:</span
            >

            <span>{{ props.species.properties.type }}</span>
          </div>

          <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
            <span class="min-w-20 text-sm font-medium text-highlighted"
              >Размер:</span
            >

            <span>{{ props.species.properties.size }}</span>
          </div>

          <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
            <span class="min-w-20 text-sm font-medium text-highlighted"
              >Скорость:</span
            >

            <span>{{ props.species.properties.speed }}</span>
          </div>
        </div>
      </template>

      <UButton
        v-if="props.species.hasLineages"
        block
        @click.left.exact.prevent="openLineages(props.species.url)"
      >
        Происхождения
      </UButton>
    </div>

    <div class="flex flex-auto flex-col gap-6">
      <div>
        <MarkupRender
          v-if="props.species.description"
          :entries="props.species.description"
        />
      </div>

      <template v-if="props.species.features">
        <UiCollapse
          v-for="feature in props.species.features"
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
        v-if="!props.species.parent && props.species.hasLineages"
        :url="props.species.url"
      />
    </div>
  </div>
</template>
