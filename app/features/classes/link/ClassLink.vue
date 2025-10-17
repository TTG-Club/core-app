<script setup lang="ts">
  import { LinkPreview, LinkSubclasses } from './ui';

  import type { ClassLinkResponse } from '~classes/types';
  import { CardLink } from '~ui/link';

  const { characterClass } = defineProps<{
    characterClass: ClassLinkResponse;
  }>();

  const { isDesktop } = useDevice();

  const url = computed(() => `/classes/${characterClass.url}`);
</script>

<template>
  <CardLink
    :to="url"
    :name="characterClass.name"
    :image="characterClass.image"
    :source="characterClass.source"
    :has-actions="characterClass.hasSubclasses"
  >
    <template #actions>
      <LinkPreview
        v-if="isDesktop"
        :url="characterClass.url"
      />

      <LinkSubclasses
        v-if="characterClass.hasSubclasses"
        :url="characterClass.url"
      />
    </template>
  </CardLink>
</template>
