<script setup lang="ts">
  import type { EffectConditionKey } from '~active-effects/model';

  import {
    describeActiveEffect,
    EFFECT_CONDITION_TEMPLATES,
  } from '~active-effects/model';

  import { useCharacterSheet, useSheetActiveEffects } from '../../composables';
  import { SHEET_EFFECT_LABELS, SHEET_TAB_EMPTY_LABELS } from '../../model';

  const emit = defineEmits<{
    'add-effect': [];
    'edit-effect': [effectId: string];
  }>();

  const { editControlClass } = useCharacterSheet();

  const {
    customEffects,
    conditionEffects,
    equipmentEffects,
    isConditionActive,
    removeEffect,
    toggleEffectDisabled,
    toggleCondition,
  } = useSheetActiveEffects();

  /**
   * Строки блока наложенных эффектов: свои эффекты и состояния одним списком —
   * для листа это одно и то же, разница только в способе завести.
   */
  const ownRows = computed(() =>
    [...conditionEffects.value, ...customEffects.value].map((effect) => ({
      id: effect.id,
      name: effect.name,
      icon: effect.icon || 'tabler:sparkles',
      description: effect.description || describeActiveEffect(effect),
      disabled: effect.disabled,
      // Состояние правится плиткой, а не формой: у него нет своих настроек.
      isCondition: effect.conditionKey !== undefined,
      rowClass: effect.disabled ? 'opacity-50 grayscale' : '',
    })),
  );

  /** Плитки состояний с признаком «наложено». */
  const conditionTiles = computed(() =>
    EFFECT_CONDITION_TEMPLATES.map((template) => ({
      key: template.key,
      name: template.name,
      icon: template.icon,
      description: template.description,
      isActive: isConditionActive(template.key),
    })),
  );

  function handleAdd() {
    emit('add-effect');
  }

  function handleEdit(effectId: string) {
    emit('edit-effect', effectId);
  }

  function handleToggleCondition(key: EffectConditionKey) {
    toggleCondition(key);
  }
</script>

<template>
  <div class="flex flex-col gap-4 pt-2">
    <!-- Наложенные эффекты: свои и состояния -->
    <section class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-highlighted">
          {{ SHEET_EFFECT_LABELS.ownTitle }}
        </h3>

        <UButton
          icon="tabler:plus"
          :label="SHEET_EFFECT_LABELS.add"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="editControlClass"
          @click.left.exact.prevent="handleAdd"
        />
      </div>

      <p
        v-if="!ownRows.length"
        class="rounded-lg border border-dashed border-default/60 px-3 py-4 text-sm text-muted"
      >
        {{ SHEET_TAB_EMPTY_LABELS.effects }}
      </p>

      <div
        v-for="row in ownRows"
        :key="row.id"
        class="group/effect flex items-start gap-2 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2"
        :class="row.rowClass"
      >
        <UIcon
          :name="row.icon"
          class="mt-0.5 size-5 shrink-0 text-muted"
        />

        <div class="flex min-w-0 grow flex-col">
          <span class="truncate text-sm font-medium text-highlighted">
            {{ row.name }}
          </span>

          <span class="text-xs text-muted">
            {{ row.description || SHEET_EFFECT_LABELS.noDescription }}
          </span>
        </div>

        <USwitch
          :model-value="!row.disabled"
          size="sm"
          class="shrink-0"
          :aria-label="SHEET_EFFECT_LABELS.toggle"
          @update:model-value="toggleEffectDisabled(row.id)"
        />

        <UButton
          v-if="!row.isCondition"
          icon="tabler:pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          class="shrink-0"
          :class="editControlClass"
          :aria-label="SHEET_EFFECT_LABELS.edit"
          @click.left.exact.prevent="handleEdit(row.id)"
        />

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          square
          class="shrink-0"
          :class="editControlClass"
          :aria-label="SHEET_EFFECT_LABELS.remove"
          @click.left.exact.prevent="removeEffect(row.id)"
        />
      </div>
    </section>

    <!-- От снаряжения: только для показа -->
    <section class="flex flex-col gap-2">
      <div class="flex flex-col">
        <h3 class="text-sm font-semibold text-highlighted">
          {{ SHEET_EFFECT_LABELS.equipmentTitle }}
        </h3>

        <span class="text-xs text-muted">
          {{ SHEET_EFFECT_LABELS.equipmentHint }}
        </span>
      </div>

      <p
        v-if="!equipmentEffects.length"
        class="rounded-lg border border-dashed border-default/60 px-3 py-4 text-sm text-muted"
      >
        {{ SHEET_EFFECT_LABELS.equipmentEmpty }}
      </p>

      <div
        v-for="row in equipmentEffects"
        :key="`${row.sourceName}:${row.effect.id}`"
        class="flex items-start gap-2 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2"
      >
        <UIcon
          :name="row.effect.icon || 'tabler:sparkles'"
          class="mt-0.5 size-5 shrink-0 text-muted"
        />

        <div class="flex min-w-0 grow flex-col">
          <span class="truncate text-sm font-medium text-highlighted">
            {{ row.effect.name }}
          </span>

          <span class="text-xs text-muted">{{ row.sourceName }}</span>
        </div>
      </div>
    </section>

    <!-- Состояния сеткой -->
    <section class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-highlighted">
        {{ SHEET_EFFECT_LABELS.conditionsTitle }}
      </h3>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <UButton
          v-for="tile in conditionTiles"
          :key="tile.key"
          :icon="tile.icon"
          :label="tile.name"
          :color="tile.isActive ? 'primary' : 'neutral'"
          :variant="tile.isActive ? 'soft' : 'outline'"
          size="sm"
          block
          class="justify-start"
          :class="editControlClass"
          :title="tile.description"
          @click.left.exact.prevent="handleToggleCondition(tile.key)"
        />
      </div>
    </section>
  </div>
</template>
