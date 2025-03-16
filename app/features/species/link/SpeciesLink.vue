<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { NuxtLink } from '#components';
  import { GroupTag } from '~ui/source-tag';
  import { useDrawer } from '~/shared/composables';

  const { inLineagesDrawer } = defineProps<{
    species: SpeciesLinkResponse;
    inLineagesDrawer?: boolean;
  }>();

  const { open: openLineages } = useDrawer('species-lineages');

  const { open: openPreview } = useDrawer(
    inLineagesDrawer ? 'species-lineage-detail' : 'species-detail',
  );
</script>

<template>
  <NuxtLink :to="`/species/${species.url}`">
    <ACard :body-style="{ padding: '24px 16px 16px 16px' }">
      <template #cover>
        <div :class="$style.coverCard">
          <AImage
            :src="species.image || '/img/no-img.webp'"
            :alt="species.name.rus"
            :class="$style.image"
            :preview="false"
            fallback="/img/no-img.webp"
            loading="lazy"
            width="100%"
          />
        </div>
      </template>

      <ACardMeta>
        <template #title>
          <AFlex
            justify="space-between"
            align="center"
            gap="4"
          >
            <span
              :class="$style.name"
              :title="species.name.rus"
            >
              {{ species.name.rus }}
            </span>

            <GroupTag :group="species.source.group" />
          </AFlex>
        </template>

        <template #description>
          <span :title="species.name.rus">
            {{ species.name.eng }}
          </span>
        </template>
      </ACardMeta>

      <template #actions>
        <span @click.left.exact.prevent.stop="openPreview(species.url)">
          Предпросмотр
        </span>

        <span
          v-if="species.hasLineages"
          @click.left.exact.prevent.stop="openLineages(species.url)"
        >
          Разновидности
        </span>
      </template>
    </ACard>
  </NuxtLink>
</template>

<style module lang="scss">
  .coverCard {
    overflow: hidden;
  }

  .image {
    width: 100%;
    opacity: 0.9;
  }

  .name {
    overflow: hidden;
    display: inline-block;
    flex: 1;

    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
