<script setup lang="ts">
  import { SpeciesLineages } from '~species/lineages';
  import { MarkupRender } from '~ui/markup';

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
  <div class="flex flex-col gap-4">
    <MarkupRender
      v-if="species.description"
      :entries="species.description"
    />

    <template v-if="species.features">
      <UCollapsible
        v-for="feature in species.features"
        :id="feature.url"
        :key="feature.url"
        default-open
      >
        <template #default="{ open }">
          <h4
            class="flex cursor-pointer items-center gap-4 text-xl font-semibold"
          >
            <UIcon
              name="i-fluent-chevron-down-16-regular"
              class="transition-transform duration-150 ease-in-out"
              :class="open ? '-rotate-180' : ''"
            />

            <span>
              {{ feature.name.rus }}
            </span>
          </h4>
        </template>

        <template #content>
          <MarkupRender :entries="feature.description" />
        </template>
      </UCollapsible>
    </template>

    <SpeciesLineages
      v-if="!species.parent && species.hasLineages"
      :url="species.url"
    />
  </div>
</template>
