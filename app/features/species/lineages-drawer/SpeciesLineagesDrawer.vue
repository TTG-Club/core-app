<script setup lang="ts">
  import { SpeciesLink } from '~species/link';
  import { UiDrawer } from '~ui/drawer';

  import type { SpeciesLinkResponse } from '~/shared/types';

  const { specieses = [] } = defineProps<{
    specieses?: SpeciesLinkResponse[];
    isError?: boolean;
    isLoading?: boolean;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();
</script>

<template>
  <UiDrawer
    title="Происхождения"
    :is-loading
    :is-error
  >
    <div :class="$style.container">
      <div :class="$style.grid">
        <SpeciesLink
          v-for="link in specieses"
          :key="link.url"
          :species="link"
        >
          {{ link.url }}
        </SpeciesLink>
      </div>
    </div>
  </UiDrawer>
</template>

<style module lang="scss">
  .grid {
    display: grid;
    grid-gap: 16px;
    grid-template-columns: repeat(1, 248px);

    @include media-min($sm) {
      grid-template-columns: repeat(2, 248px);
    }
  }
</style>
