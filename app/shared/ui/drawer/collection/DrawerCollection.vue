<script setup lang="ts">
  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { MagicItemDrawer } from '~magic-items/drawer';
  import { SpeciesDrawer } from '~species/drawer';
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';
  import { SpellDrawer } from '~spells/drawer';
</script>

<template>
  <SpeciesDrawer />

  <SpeciesLineagesDrawer />

  <SpellDrawer />

  <FeatDrawer />

  <BackgroundDrawer />

  <MagicItemDrawer />
</template>
