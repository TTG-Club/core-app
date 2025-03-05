<script setup lang="ts">
  import type { SpecieLinkResponse } from '~/shared/types';
  import { SpeciesLink } from '../link';

  const open = defineModel<boolean>();

  const props = defineProps<{
    url: string;
  }>();

  const { data, status, execute } = useFetch<Array<SpecieLinkResponse>>(
    '/api/v2/species/related',
    {
      immediate: false,
      query: {
        subSpeciesUrl: props.url,
      },
    },
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
          :specie="link"
        >
          {{ link.url }}
        </SpeciesLink>
      </AFlex>
    </ASpin>
  </ADrawer>
</template>
