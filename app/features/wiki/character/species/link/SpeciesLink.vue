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
    :class="$style.link"
    :to="`/species/${specie.url}`"
  >
    <ACard hoverable>
      <template #cover>
        <div :class="$style.coverCard">
          <img
            v-if="specie.image"
            :alt="specie.name.rus"
            :src="specie.image"
            :class="$style.image"
            height="240px"
            width="252px"
            loading="lazy"
          />
        </div>
      </template>

      <ACardMeta :title="`${specie.name.eng} (${specie.name.rus})`">
        <template #description>
          <ATag> PHB </ATag>

          <AButton
            v-if="showSubspecies"
            type="default"
            size="small"
            @click.left.exact.prevent.stop
          >
            Разновидности
          </AButton>
        </template>
      </ACardMeta>
    </ACard>
  </component>
</template>

<style module lang="scss">
  .link {
    position: relative;
  }

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
    pointer-events: none;
    display: block;
    height: 100%;
    opacity: 0.8;
  }
</style>
