<script setup lang="ts">
  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { BeastDrawer } from '~bestiary/drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { GlossaryDrawer } from '~glossary/drawer';
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

  <GlossaryDrawer />

  <BackgroundDrawer />

  <MagicItemDrawer />

  <BeastDrawer />
</template>
