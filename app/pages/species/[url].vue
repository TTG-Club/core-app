<script setup lang="ts">
  import type { Specie } from '~~/shared/types/character/species';

  const {
    params: { url },
  } = useRoute();

  const { data, error, status } = useProxy<Specie>(`/species/${url}`);
</script>

<template>
  <span> {{ data }}, {{ error }}, {{ status }} </span>
</template>
