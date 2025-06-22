<script setup lang="ts">
  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { CreatureDrawer } from '~bestiary/drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { GlossaryDrawer } from '~glossary/drawer';
  import { MagicItemDrawer } from '~magic-items/drawer';
  import { SpeciesDrawer } from '~species/drawer';
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';
</script>

<template>
  <SpeciesDrawer />

  <SpeciesLineagesDrawer />

  <FeatDrawer />

  <GlossaryDrawer />

  <BackgroundDrawer />

  <MagicItemDrawer />

  <CreatureDrawer />
</template>
