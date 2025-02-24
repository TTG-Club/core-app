<script setup lang="ts">
  import type { SpecieLink } from '~/shared/types';
  import { NuxtLink } from '#components';

  withDefaults(
    defineProps<{
      specie: SpecieLink;
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
          <img
            v-if="specie.image"
            :alt="specie.name.rus"
            :src="specie.image"
            :class="$style.image"
            loading="lazy"
          />
        </div>
      </template>

      <ACardMeta>
        <template #title>
          <AFlex justify="space-between">
            <span> {{ specie.name.rus }} [{{ specie.name.eng }}] </span>

            <ATag> PHB </ATag>
          </AFlex>
        </template>
      </ACardMeta>

      <template #actions>
        <span @click.left.exact.prevent.stop> Предпросмотр </span>

        <span
          v-if="!showSubspecies"
          @click.left.exact.prevent.stop
        >
          Разновидности
        </span>
      </template>
    </ACard>
  </component>
</template>

<style module lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    width: 100%;
    min-height: 120px;
    padding: 8px;

    background: var(--color-bg-liner-list);
  }

  .bottom {
    width: 100%;
    margin-top: auto;
  }

  .coverCard {
    overflow: hidden;
    height: 240px;
  }

  .image {
    width: 100%;
    opacity: 0.8;
  }
</style>
