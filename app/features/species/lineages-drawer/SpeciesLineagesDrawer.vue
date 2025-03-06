<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { SpeciesLink } from '../link';
  import { DrawerBody, DrawerTitle } from '~/shared/ui';

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
  <ADrawer
    v-model:open="open"
    :content-wrapper-style="{
      minWidth: '296px',
      maxWidth: '552px',
    }"
    width="auto"
    destroy-on-close
  >
    <template #title>
      <DrawerTitle name="Разновидности" />
    </template>

    <template #default>
      <DrawerBody :is-loading="status === 'pending'">
        <template #body>
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
        </template>
      </DrawerBody>
    </template>
  </ADrawer>
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
