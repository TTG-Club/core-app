<script setup lang="ts">
  import type { SpeciesFeatureCreate } from '../../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import {
    FeatCounterRows,
    FeatGrantRows,
    FeatModifierRows,
    FeatSpellChoices,
    FeatSpellListSpells,
  } from '~feats/editor/ui';
  import { createFeatEditorRows, createFeatMechanics } from '~feats/model';
  import { InfoTooltip } from '~ui/tooltip';

  import {
    getFeatureFilledBlocksCount,
    SPECIES_EDITOR_LABELS,
    SPECIES_INNATE_SPELL_EDITOR,
    SPECIES_MECHANICS_LABELS,
  } from '../../model';
  import SpeciesFeatureSpells from './SpeciesFeatureSpells.vue';

  /**
   * Дары, заклинания и эффекты одного умения вида.
   *
   * Всё, что умение даёт, лежит у самого умения — как и в системе D&D, где вид
   * настраивается одной вкладкой «Особенности». Разнесённое по вкладкам
   * приходилось бы сводить в голове: какое из умений выдаёт заклинание, форма
   * тогда не показывала вовсе.
   *
   * Свёрнутым блоком, а не полями рядом с описанием: у большинства умений
   * механики нет вовсе, а развёрнутая она заслоняла бы список умений.
   */
  const feature = defineModel<SpeciesFeatureCreate>({ required: true });

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

  /** Механика: из неё редактируется расширение списка заклинаний, минуя строки. */
  const mechanics = computed({
    get: () => feature.value.mechanics ?? createFeatMechanics(),
    set: (value) => {
      feature.value.mechanics = value;
    },
  });

  /**
   * Сколько блоков механики уже заполнено. Список умений длинный, а механика
   * свёрнута: без пометки автор не видит, какие умения настроены, и раскрывает
   * их по одному. Счёт общий со шапкой строки списка особенностей.
   */
  const filledBlocksCount = computed(() =>
    getFeatureFilledBlocksCount(feature.value),
  );
</script>

<template>
  <UCollapsible class="col-span-full">
    <UButton
      class="w-full"
      color="neutral"
      variant="subtle"
      trailing-icon="tabler:chevron-down"
      :label="SPECIES_EDITOR_LABELS.featureAdvanced"
    >
      <template #trailing>
        <UBadge
          v-if="filledBlocksCount"
          size="sm"
          color="primary"
          variant="subtle"
        >
          {{ filledBlocksCount }}
        </UBadge>

        <UIcon name="tabler:chevron-down" />
      </template>
    </UButton>

    <template #content>
      <div class="grid gap-6 pt-4">
        <div class="grid gap-2">
          <InfoTooltip
            :text="SPECIES_EDITOR_LABELS.grantsHint"
            icon="tabler:info-circle-filled"
            class="text-sm text-highlighted"
          >
            <h3 class="truncate">
              {{ SPECIES_EDITOR_LABELS.featureGrantsTitle }}
            </h3>
          </InfoTooltip>

          <FeatGrantRows
            v-model="editorRows.grants"
            :rows="editorRows"
          />
        </div>

        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ SPECIES_EDITOR_LABELS.featureModifiersTitle }}
          </h3>

          <FeatModifierRows
            v-model="editorRows.modifiers"
            :rows="editorRows"
          />
        </div>

        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ SPECIES_EDITOR_LABELS.featureCountersTitle }}
          </h3>

          <FeatCounterRows v-model="editorRows.counters" />
        </div>

        <!-- Выбор заклинаний игроком и расширение списка — те же блоки, что у
          черты и умения класса: без них настройка жила бы в записи невидимкой -->
        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ SPECIES_EDITOR_LABELS.featureSpellChoicesTitle }}
          </h3>

          <FeatSpellChoices
            v-model="editorRows.spellChoice"
            :rows="editorRows"
            :labels="SPECIES_MECHANICS_LABELS"
          />
        </div>

        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ SPECIES_EDITOR_LABELS.featureSpellListTitle }}
          </h3>

          <FeatSpellListSpells
            v-model="mechanics.spellList"
            :labels="SPECIES_MECHANICS_LABELS"
          />
        </div>

        <div class="grid gap-2">
          <InfoTooltip
            :text="SPECIES_INNATE_SPELL_EDITOR.description"
            icon="tabler:info-circle-filled"
            class="text-sm text-highlighted"
          >
            <h3 class="truncate">
              {{ SPECIES_EDITOR_LABELS.featureSpellsTitle }}
            </h3>
          </InfoTooltip>

          <SpeciesFeatureSpells
            v-model="feature.grantedSpells"
            :feature-level="feature.level"
          />
        </div>

        <div class="grid gap-2">
          <h3 class="truncate text-sm text-highlighted">
            {{ SPECIES_EDITOR_LABELS.featureEffectsTitle }}
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
