<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { NuxtLink } from '#components';
  import { SpeciesDrawer } from '~species/drawer';
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';
  import { GroupTag } from '~ui/source-tag';

  defineProps<{
    species: SpeciesLinkResponse;
  }>();

  const link = useTemplateRef('link');
  const isDrawerEnabled = useElementVisibility(link);

  const showLineages = ref(false);
  const isDrawerVisible = ref(false);
</script>

<template>
  <NuxtLink
    v-slot="{ href }"
    :to="`/species/${species.url}`"
    custom
  >
    <a
      ref="link"
      :href
    >
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
          <span @click.left.exact.prevent.stop="isDrawerVisible = true">
            Предпросмотр
          </span>

          <span
            v-if="species.hasLineages"
            @click.left.exact.prevent.stop="showLineages = true"
          >
            Разновидности
          </span>
        </template>
      </ACard>

      <ClientOnly>
        <SpeciesDrawer
          v-if="isDrawerEnabled"
          v-model="isDrawerVisible"
          :url="species.url"
        />

        <SpeciesLineagesDrawer
          v-if="species.hasLineages && isDrawerEnabled"
          v-model="showLineages"
          :url="species.url"
        />
      </ClientOnly>
    </a>
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
