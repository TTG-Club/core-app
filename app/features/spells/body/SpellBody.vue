<script setup lang="ts">
  import type { SpellDetailResponse } from '~spells/model';

  import { AffiliationBlock } from '~ui/affiliation';
  import { UiDetailLayout } from '~ui/detail-layout';

  import { DescriptionsBlock, StatsBlock, TopBar } from './ui';

  defineProps<{
    spell: SpellDetailResponse;
  }>();
</script>

<template>
  <UiDetailLayout>
    <template #aside>
      <div class="flex flex-col gap-3">
        <TopBar
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
    </template>

    <div class="flex flex-col gap-3">
      <div>
        <DescriptionsBlock
          :description="spell.description"
          :level="spell.level"
          :upper="spell.upper"
        />
      </div>

      <AffiliationBlock
        v-if="spell.affiliation?.classes"
        :items="spell.affiliation.classes"
        label="Классы"
        section="classes"
      />

      <AffiliationBlock
        v-if="spell.affiliation?.subclasses"
        :items="spell.affiliation.subclasses"
        label="Подклассы"
        section="classes"
      />

      <AffiliationBlock
        v-if="spell.affiliation?.species"
        :items="spell.affiliation.species"
        label="Виды"
        section="species"
      />

      <AffiliationBlock
        v-if="spell.affiliation?.lineages"
        :items="spell.affiliation.lineages"
        label="Происхождения"
        section="species"
      />

      <AffiliationBlock
        v-if="spell.affiliation?.feats"
        :items="spell.affiliation.feats"
        label="Черты"
        section="feats"
      />
    </div>
  </UiDetailLayout>
</template>
