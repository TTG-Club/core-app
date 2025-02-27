<script setup lang="ts">
  import type { SpellDetail } from '~/shared/types';
  import {
    TopBar,
    StatsBlock,
    AffiliationBlock,
    DescriptionsBlock,
  } from './ui';

  defineProps<{
    spell: SpellDetail;
  }>();
</script>

<template>
  <AFlex
    :gap="12"
    vertical
  >
    <TopBar
      :additional-type="spell.additionalType"
      :ritual="spell.ritual"
      :school="spell.school"
      :level="spell.level"
    />

    <StatsBlock
      :casting-time="spell.castingTime"
      :components="spell.components"
      :duration="spell.duration"
      :range="spell.range"
    />

    <DescriptionsBlock
      :description="spell.description"
      :level="spell.level"
      :upper="spell.upper"
    />

    <AffiliationBlock
      v-if="spell.affiliation?.classes"
      :items="spell.affiliation.classes"
      label="Классы"
    />

    <AffiliationBlock
      v-if="spell.affiliation?.subclasses"
      :items="spell.affiliation.subclasses"
      label="Архетипы"
    />

    <AffiliationBlock
      v-if="spell.affiliation?.species"
      :items="spell.affiliation.species"
      label="Виды"
    />

    <AffiliationBlock
      v-if="spell.affiliation?.lineages"
      :items="spell.affiliation.lineages"
      label="Происхождения"
    />
  </AFlex>
</template>
