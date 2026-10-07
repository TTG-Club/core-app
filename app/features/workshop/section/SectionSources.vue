<script setup lang="ts">
  import { CardWorkshop } from '~ui/card';

  const { canEditSources } = useUserRoles();
</script>

<template>
  <CardWorkshop
    v-if="canEditSources"
    title="Источники"
    section="sources"
  />
</template>
