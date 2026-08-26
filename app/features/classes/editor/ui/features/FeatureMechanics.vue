<script setup lang="ts">
  import type { ClassFeatureCreate } from '../../../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import {
    FeatCounterRows,
    FeatGrantedSpells,
    FeatGrantRows,
    FeatModifierRows,
  } from '~feats/editor/ui';
  import { createFeatEditorRows, createFeatMechanics } from '~feats/model';

  import { CLASS_EDITOR_LABELS } from '../../../model';

  /**
   * Механика и эффекты одного умения класса.
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
</script>

<template>
  <UCollapsible class="col-span-full">
    <UButton
      class="w-full"
      color="neutral"
      variant="subtle"
      trailing-icon="tabler:chevron-down"
      :label="CLASS_EDITOR_LABELS.featureAdvanced"
    />

    <template #content>
      <div class="grid gap-6 pt-4">
        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ CLASS_EDITOR_LABELS.featureGrantsTitle }}
          </h3>

          <FeatGrantRows
            v-model="editorRows.grants"
            :rows="editorRows"
          />
        </div>

        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ CLASS_EDITOR_LABELS.featureModifiersTitle }}
          </h3>

          <FeatModifierRows
            v-model="editorRows.modifiers"
            :rows="editorRows"
          />
        </div>

        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ CLASS_EDITOR_LABELS.featureCountersTitle }}
          </h3>

          <FeatCounterRows v-model="editorRows.counters" />
        </div>

        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ CLASS_EDITOR_LABELS.featureSpellsTitle }}
          </h3>

          <FeatGrantedSpells v-model="mechanics.spells" />
        </div>

        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ CLASS_EDITOR_LABELS.featureEffectsTitle }}
          </h3>

          <ActiveEffects
            v-model="feature.activeEffects"
            :origin="EFFECT_ORIGIN.feature"
          />
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
