<script setup lang="ts">
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';
  import { SpeciesDrawer } from '~species/drawer';
  import { SpellDrawer } from '~spells/drawer';
</script>

<template>
  <SpeciesDrawer />

  <SpeciesLineagesDrawer />

  <SpellDrawer />
</template>
