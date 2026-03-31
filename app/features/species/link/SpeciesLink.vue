<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~species/model';

  import { CardLink } from '~ui/link';

  import { LinkLineages, LinkPreview } from './ui';

  const { species } = defineProps<{
    species: SpeciesLinkResponse;
  }>();

  const { isDesktop } = useDevice();

  const url = computed(() => `/species/${species.url}`);
</script>

<template>
  <CardLink
    :to="url"
    :name="species.name"
    :image="species.image"
    :source="species.source"
    :has-actions="species.hasLineages"
  >
    <template #actions>
      <LinkPreview
        v-if="isDesktop"
        :url="species.url"
      />

      <LinkLineages
        v-if="species.hasLineages"
        :url="species.url"
      />
    </template>
  </CardLink>
</template>
