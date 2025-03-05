<script setup lang="ts">
  import type { NameResponse, SpecieLinkResponse } from '~/shared/types';
  import { SpeciesLink } from '../../link';

  const { name, url, image } = defineProps<{
    name: Pick<NameResponse, 'rus' | 'eng'>;
    url: string;
    image: string | undefined;
  }>();

  const specieLinkPreview = computed<SpecieLinkResponse>(() => ({
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
  <SpeciesLink :specie="specieLinkPreview" />
</template>
