<script setup lang="ts">
  import type { FeatEditorLabelOverrides } from '~feats/model';

  import type {
    ClassMechanicsHolderCreate,
    ClassMechanicsTitles,
  } from '../../../model';

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

  import { getClassMechanicsFilledBlocksCount } from '../../../model';
  import FeatureSection from './FeatureSection.vue';

  /**
   * Механика и эффекты одного носителя даров: что он делает на листе
   * персонажа. Одной формой у умения класса и у его варианта — набор даров у
   * них один, и вторая форма для того же смысла разошлась бы с первой.
   *
   * Выбор боевого стиля и черты за повышение характеристик тоже здесь —
   * строками даров «Черта → дать выбрать», как у черты и вида.
   *
   * Свёрнутым блоком, а не полями рядом с описанием: у большинства умений
   * механики нет вовсе, а развёрнутая она заслоняла бы список умений.
   */
  const { titles, labels } = defineProps<{
    /** Подписи блоков: источник даров у умения и у варианта называется по-разному. */
    titles: ClassMechanicsTitles;

    /** Поправки к подписям редакторов механики — они общие с чертой. */
    labels: FeatEditorLabelOverrides;
  }>();

  const holder = defineModel<ClassMechanicsHolderCreate>({ required: true });

  /**
   * Строки редактора даров. В типе они необязательны — перед отправкой
   * механика пересобирается из них, а сами строки выбрасываются, — поэтому
   * шаблону нужен непустой объект. Пустых здесь не бывает: и новая запись, и
   * загруженная приходят со строками.
   */
  const editorRows = computed({
    get: () => holder.value.editorRows ?? createFeatEditorRows(),
    set: (value) => {
      holder.value.editorRows = value;
    },
  });

  /** Механика: из неё редактируются заклинания, минуя строки. */
  const mechanics = computed({
    get: () => holder.value.mechanics ?? createFeatMechanics(),
    set: (value) => {
      holder.value.mechanics = value;
    },
  });

  const filledBlocksCount = computed(() =>
    getClassMechanicsFilledBlocksCount(holder.value),
  );
</script>

<template>
  <FeatureSection
    :title="titles.section"
    :hint="titles.sectionHint"
    :count="filledBlocksCount"
  >
    <div class="grid gap-3">
      <FeatGrantRows
        v-model="editorRows.grants"
        :rows="editorRows"
        :labels="labels"
        :title="titles.grants"
      />

      <FeatModifierRows
        v-model="editorRows.modifiers"
        :rows="editorRows"
        :labels="labels"
        :title="titles.modifiers"
      />

      <FeatCounterRows
        v-model="editorRows.counters"
        :labels="labels"
        :title="titles.counters"
      />

      <FeatGrantedSpells
        v-model="mechanics.spells"
        :labels="labels"
        :title="titles.spells"
      />

      <FeatSpellListSpells
        v-model="mechanics.spellList"
        :labels="labels"
        :title="titles.spellList"
      />

      <ActiveEffects
        v-model="holder.activeEffects"
        :origin="EFFECT_ORIGIN.feature"
        :title="titles.effects"
      />
    </div>
  </FeatureSection>
</template>
