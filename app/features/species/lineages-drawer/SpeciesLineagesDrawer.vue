<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { SpeciesLink } from '../link';
  import { DrawerComponent } from '~/shared/ui';

  const open = defineModel<boolean>();

  const { url } = defineProps<{
    url: string;
  }>();

  const { data, status, execute } = useFetch<Array<SpeciesLinkResponse>>(
    `/api/v2/species/${url}/lineages/search`,
    { immediate: false },
  );

  watch(open, (value) => {
    if (!value) {
      return;
    }

    execute();
  });
</script>

<template>
  <DrawerComponent
    v-model:open="open"
    title="Разновидности"
    :min-width="296"
    :max-width="552"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="auto"
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
  </DrawerComponent>
</template>

<style module lang="scss">
  .grid {
    display: grid;
    grid-gap: 8px;
    grid-template-columns: repeat(1, 248px);

    @include media-min($sm) {
      grid-template-columns: repeat(2, 248px);
    }
  }
</style>
