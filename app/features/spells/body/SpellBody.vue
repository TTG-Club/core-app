<script setup lang="ts">
  import type { SpellDetailResponse } from '~/shared/types';
  import {
    TopBar,
    StatsBlock,
    AffiliationBlock,
    DescriptionsBlock,
  } from './ui';

  defineProps<{
    spell: SpellDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <AFlex
        vertical
        :gap="12"
        flex="1 1 auto"
      >
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

      <AFlex
        vertical
        :gap="12"
        :class="$style.info"
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
      </AFlex>
    </div>
  </div>
</template>

<style module lang="scss">
  .container {
    container-type: inline-size;
  }

  .body {
    display: flex;
    flex-direction: column-reverse;
    gap: 12px;

    @container (width > 800px) {
      flex-direction: row;
    }
  }

  .info {
    width: 100%;
    max-width: 100%;

    @container (width > 800px) {
      max-width: 360px;
    }
  }
</style>
