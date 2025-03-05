<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import { SpeciesLink } from '../link';

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
    title="Разновидности"
  >
    <ASpin :spinning="status === 'pending'">
      <AFlex
        vertical
        :gap="16"
      >
        <SpeciesLink
          v-for="link in data"
          :key="link.url"
          :species="link"
        >
          {{ link.url }}
        </SpeciesLink>
      </AFlex>
    </ASpin>
  </ADrawer>
</template>
