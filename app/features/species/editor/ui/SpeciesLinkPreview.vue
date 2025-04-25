<script setup lang="ts">
  import { SpeciesLink } from '~species/link';

  import type { NameResponse, SpeciesLinkResponse } from '~/shared/types';

  const { name, url, image } = defineProps<{
    name: Pick<NameResponse, 'rus' | 'eng'>;
    url: string;
    image: string | undefined;
  }>();

  const speciesLinkPreview = computed<SpeciesLinkResponse>(() => ({
    url,
    name: {
      rus: name.rus || 'Название вида',
      eng: name.eng || "Specie's name",
    },
    image: image || '',
    source: {
      name: {
        rus: '',
        eng: '',
        label: '',
      },
      group: {
        rus: '',
        eng: '',
        label: '',
      },
      page: 0,
    },
    updatedAt: new Date().toISOString(),
  }));
</script>

<template>
  <SpeciesLink :species="speciesLinkPreview" />
</template>
