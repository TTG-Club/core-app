<script setup lang="ts">
  import type { ClassFeatureCreate } from '../../../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import {
    FeatCounterRows,
    FeatGrantedSpells,
    FeatGrantRows,
    FeatModifierRows,
    FeatSpellListSpells,
  } from '~feats/editor/ui';
  import { createFeatEditorRows, createFeatMechanics } from '~feats/model';

  import {
    CLASS_EDITOR_LABELS,
    CLASS_FEATURE_MECHANICS_LABELS,
    CLASS_FEATURES_EDITOR,
    getClassFeatureFilledBlocksCount,
  } from '../../../model';
  import FeatureSection from './FeatureSection.vue';

  /**
   * Механика и эффекты одного умения класса: что умение делает на листе
   * персонажа. Выбор боевого стиля и черты за повышение характеристик тоже
   * здесь — строками даров «Черта → дать выбрать», как у черты и вида.
   *
   * Свёрнутым блоком, а не полями рядом с описанием: у большинства умений
   * механики нет вовсе, а развёрнутая она заслоняла бы список умений.
   */
  const feature = defineModel<ClassFeatureCreate>({ required: true });

  /**
   * Строки редактора даров умения. В типе они необязательны — перед отправкой
   * механика пересобирается из них, а сами строки выбрасываются, — поэтому
   * шаблону нужен непустой объект. Пустых здесь не бывает: и новое умение, и
   * загруженное приходят со строками.
   */
  const editorRows = computed({
    get: () => feature.value.editorRows ?? createFeatEditorRows(),
    set: (value) => {
      feature.value.editorRows = value;
    },
  });

  /** Механика умения: из неё редактируются заклинания, минуя строки. */
  const mechanics = computed({
    get: () => feature.value.mechanics ?? createFeatMechanics(),
    set: (value) => {
      feature.value.mechanics = value;
    },
  });

  const filledBlocksCount = computed(() =>
    getClassFeatureFilledBlocksCount(feature.value),
  );
</script>

<template>
  <FeatureSection
    :title="CLASS_FEATURES_EDITOR.mechanicsTitle"
    :hint="CLASS_FEATURES_EDITOR.mechanicsHint"
    :count="filledBlocksCount"
  >
    <div class="grid gap-3">
      <FeatGrantRows
        v-model="editorRows.grants"
        :rows="editorRows"
        :labels="CLASS_FEATURE_MECHANICS_LABELS"
        :title="CLASS_EDITOR_LABELS.featureGrantsTitle"
      />

      <FeatModifierRows
        v-model="editorRows.modifiers"
        :rows="editorRows"
        :labels="CLASS_FEATURE_MECHANICS_LABELS"
        :title="CLASS_EDITOR_LABELS.featureModifiersTitle"
      />

      <FeatCounterRows
        v-model="editorRows.counters"
        :labels="CLASS_FEATURE_MECHANICS_LABELS"
        :title="CLASS_EDITOR_LABELS.featureCountersTitle"
      />

      <FeatGrantedSpells
        v-model="mechanics.spells"
        :labels="CLASS_FEATURE_MECHANICS_LABELS"
        :title="CLASS_EDITOR_LABELS.featureSpellsTitle"
      />

      <FeatSpellListSpells
        v-model="mechanics.spellList"
        :labels="CLASS_FEATURE_MECHANICS_LABELS"
        :title="CLASS_EDITOR_LABELS.featureSpellListTitle"
      />

      <ActiveEffects
        v-model="feature.activeEffects"
        :origin="EFFECT_ORIGIN.feature"
        :title="CLASS_EDITOR_LABELS.featureEffectsTitle"
      />
    </div>
  </FeatureSection>
</template>
