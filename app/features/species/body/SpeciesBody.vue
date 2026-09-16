<script setup lang="ts">
  import type { SpeciesDetailResponse } from '~species/model';

  import { SpeciesLineages } from '~species/lineages';
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';
  import { UiCollapse } from '~ui/collapse';
  import { UiGallery } from '~ui/gallery';
  import { MarkupRender } from '~ui/markup';

  import { StatsBlock } from './ui';

  /** Умение вида в ответе детали: описание приходит разметкой. */
  type SpeciesFeature = NonNullable<SpeciesDetailResponse['features']>[number];

  const {
    species,
    hideGallery = false,
    hideLeftBlock = false,
  } = defineProps<{
    species: SpeciesDetailResponse;
    hideGallery?: boolean;
    hideLeftBlock?: boolean;
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

  /**
   * Умения, которым есть что показать.
   *
   * Умение без описания — это одна механика: дары, заклинания или эффекты. Их
   * применяет лист персонажа, а на странице от такого умения остался бы пустой
   * раскрывающийся блок с одним заголовком.
   */
  const visibleFeatures = computed(() =>
    (species.features ?? []).filter((feature) => hasDescription(feature)),
  );

  /**
   * Есть ли у умения описание. Описание приходит разметкой: пустое — это и
   * пустая строка, и пустой список узлов.
   *
   * @param feature умение вида.
   * @returns признак непустого описания.
   */
  function hasDescription(feature: SpeciesFeature): boolean {
    const { description } = feature;

    return Array.isArray(description)
      ? description.length > 0
      : Boolean(description);
  }

  const activeFeatures = ref<Array<string>>([]);

  watch(
    () => species,
    (value) => {
      if (!value) {
        return;
      }

      activeFeatures.value = visibleFeatures.value.map(
        (feature) => feature.url,
      );
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <div class="@container">
    <div class="flex flex-col gap-6 @min-3xl:flex-row @min-3xl:gap-7">
      <div
        v-if="!hideLeftBlock"
        class="flex w-full flex-col gap-4 @min-3xl:max-w-80 @min-3xl:min-w-68"
      >
        <UiGallery
          v-if="!hideGallery"
          :preview="species.image"
          :images="species.gallery"
        />

        <StatsBlock :properties="species.properties" />

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
            :render-node="species.description"
          />
        </div>

        <template v-if="visibleFeatures.length">
          <UiCollapse
            v-for="feature in visibleFeatures"
            :id="feature.url"
            :key="feature.url"
            default-open
          >
            <template #default>
              {{ feature.name.rus }}
            </template>

            <template #content>
              <MarkupRender :render-node="feature.description" />
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
