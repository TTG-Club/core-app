<script setup lang="ts">
  import type { SpeciesFeatureCreate } from '~species/model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import { FeatGrantRows, FeatModifierRows } from '~feats/editor/ui';
  import { createFeatEditorRows } from '~feats/model';
  import { SPECIES_EDITOR_LABELS } from '~species/model';
  import { InfoTooltip } from '~ui/tooltip';

  /**
   * Дары и эффекты одного умения вида.
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
</script>

<template>
  <UCollapsible class="col-span-full">
    <UButton
      class="w-full"
      color="neutral"
      variant="subtle"
      trailing-icon="tabler:chevron-down"
      :label="SPECIES_EDITOR_LABELS.featureAdvanced"
    />

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
