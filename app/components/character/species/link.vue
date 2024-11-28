<script setup lang="ts">
  import type { SpecieLink } from '#shared/types/character/species';

  withDefaults(
    defineProps<{
      specie: SpecieLink;
      showSubspecies?: boolean;
    }>(),
    {
      showSubspecies: false,
    },
  );
</script>

<template>
  <NuxtLink
    :class="$style.link"
    :to="`/species/${specie.url}`"
  >
    <div :class="$style.container">
      <ATypographyText
        data-allow-mismatch
        :content="specie.name.rus"
        ellipsis
      />

      <ATypographyText
        data-allow-mismatch
        :content="specie.name.eng"
        type="secondary"
        ellipsis
      />

      <AFlex
        :class="$style.bottom"
        justify="space-between"
        align="center"
      >
        <AButton
          v-if="showSubspecies"
          type="default"
          size="small"
          @click.left.exact.prevent.stop
        >
          Разновидности
        </AButton>

        <ATag> PHB</ATag>
      </AFlex>
    </div>

    <img
      v-if="specie.image"
      :alt="specie.name.rus"
      :class="$style.image"
      :src="specie.image"
      loading="lazy"
    />
  </NuxtLink>
</template>

<style module lang="scss">
  .link {
    position: relative;
    overflow: hidden;
    width: 100%;
    border-radius: 8px;
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

  .image {
    pointer-events: none;

    position: absolute;
    top: 0;
    right: 0;
    transform-origin: top right 1px;

    width: 60%;

    opacity: 0.3;

    transition: transform 0.6s ease-in-out;
  }
</style>
