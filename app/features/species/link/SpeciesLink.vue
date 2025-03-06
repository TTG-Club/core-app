<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { NuxtLink } from '#components';
  import { SpeciesLineagesDrawer, SpeciesDrawer } from '~/features/species';

  withDefaults(
    defineProps<{
      species: SpeciesLinkResponse;
      disabled?: boolean;
    }>(),
    {
      disabled: false,
    },
  );

  const showLineages = ref(false);
  const isDrawerVisible = ref(false);
</script>

<template>
  <component
    :is="disabled ? 'div' : NuxtLink"
    :to="`/species/${species.url}`"
  >
    <ACard
      :hoverable="!disabled"
      :body-style="{ padding: '24px 16px 16px 16px' }"
    >
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
            <span>{{ species.name.rus }}</span>

            <ATag :style="{ margin: 0 }"> PHB </ATag>
          </AFlex>
        </template>

        <template #description>{{ species.name.eng }}</template>
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
        v-model="isDrawerVisible"
        :url="species.url"
      />

      <SpeciesLineagesDrawer
        v-if="species.hasLineages"
        v-model="showLineages"
        :url="species.url"
      />
    </ClientOnly>
  </component>
</template>

<style module lang="scss">
  .coverCard {
    overflow: hidden;
    height: 240px;
  }

  .image {
    width: 100%;
    opacity: 0.8;
  }
</style>
