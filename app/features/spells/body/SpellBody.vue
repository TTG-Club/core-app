<script setup lang="ts">
  import {
    TopBar,
    StatsBlock,
    AffiliationBlock,
    DescriptionsBlock,
  } from './ui';

  import type { SpellDetailResponse } from '~/shared/types';

  defineProps<{
    spell: SpellDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <div
        class="flex flex-col gap-3"
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
      </div>

      <div class="flex flex-[1_1_auto] flex-col gap-3">
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
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
  .container {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;

    @container (width > 800px) {
      flex-direction: row;
      gap: 28px;
    }
  }

  .info {
    width: 100%;
    max-width: 100%;

    @container (width > 800px) {
      max-width: 320px;
    }
  }
</style>
