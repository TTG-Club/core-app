<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { SpeciesLink } from '~species/link';
  import { DrawerComponent } from '~ui/drawer';
  import { useDrawer } from '~/shared/composables';
  import { SpeciesDrawer } from '~species/drawer';

  const { url, isOpened, close } = useDrawer('species-lineages');

  const { data, status, execute, clear } = await useAsyncData(
    `species-lineages-drawer`,
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<Array<SpeciesLinkResponse>>(
        `/api/v2/species/${url.value}/lineages/search`,
      );
    },
    {
      server: false,
      immediate: false,
    },
  );

  function handleUpdate(opened: boolean) {
    if (opened) {
      return;
    }

    close();
  }

  watch(isOpened, (value) => {
    if (!value) {
      return;
    }

    clear();
    execute();
  });
</script>

<template>
  <DrawerComponent
    :open="isOpened"
    title="Разновидности"
    :min-width="296"
    :max-width="552"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="auto"
    @update:open="handleUpdate"
  >
    <div :class="$style.container">
      <div :class="$style.grid">
        <SpeciesLink
          v-for="link in data"
          :key="link.url"
          :species="link"
          in-lineages-drawer
        >
          {{ link.url }}
        </SpeciesLink>
      </div>
    </div>

    <SpeciesDrawer in-lineages-drawer />
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
