<script setup lang="ts">
  import type { SpecieLink } from '#shared/types/character/species';

  const open = defineModel<boolean>();

  const props = defineProps<{
    url: string;
  }>();

  const { data, status, execute } = useProxy<Array<SpecieLink>>(
    '/species/related',
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
        <CharacterSpeciesLink
          v-for="link in data"
          :key="link.url"
          :specie="link"
        >
          {{ link.url }}
        </CharacterSpeciesLink>
      </AFlex>
    </ASpin>
  </ADrawer>
</template>
