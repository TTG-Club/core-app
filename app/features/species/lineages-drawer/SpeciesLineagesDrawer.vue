<script setup lang="ts">
  import { SpeciesLink } from '~species/link';
  import { UiDrawer } from '~ui/drawer';

  import type { SpeciesLinkResponse } from '~/shared/types';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data, status } = await useAsyncData(
    computed(() => `species-${url}-lineages`),
    () =>
      $fetch<Array<SpeciesLinkResponse>>(
        `/api/v2/species/${url}/lineages/search`,
      ),
    {
      server: false,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
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
          v-for="link in data"
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
