<script setup lang="ts">
  import type { SpecieLinkResponse } from '~/shared/types';
  import { NuxtLink } from '#components';

  withDefaults(
    defineProps<{
      specie: SpecieLinkResponse;
      showSubspecies?: boolean;
      disabled?: boolean;
    }>(),
    {
      showSubspecies: false,
      disabled: false,
    },
  );
</script>

<template>
  <component
    :is="disabled ? 'div' : NuxtLink"
    :to="`/species/${specie.url}`"
  >
    <ACard :hoverable="!disabled">
      <template #cover>
        <div :class="$style.coverCard">
          <AImage
            :src="specie.image || '/img/no-img.webp'"
            :alt="specie.name.rus"
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
            <span> {{ specie.name.rus }} [{{ specie.name.eng }}] </span>

            <ATag :style="{ margin: 0 }"> PHB </ATag>
          </AFlex>
        </template>
      </ACardMeta>

      <template #actions>
        <span @click.left.exact.prevent.stop> Предпросмотр </span>

        <span
          v-if="!showSubspecies && specie.hasLineages"
          @click.left.exact.prevent.stop
        >
          Разновидности
        </span>
      </template>
    </ACard>
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
