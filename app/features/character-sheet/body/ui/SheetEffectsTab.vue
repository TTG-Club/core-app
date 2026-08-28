<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import type { EffectConditionKey } from '~active-effects/model';

  import {
    describeActiveEffect,
    EFFECT_CONDITION_TEMPLATES,
  } from '~active-effects/model';
  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useCharacterSheet, useSheetActiveEffects } from '../../composables';
  import {
    SHEET_EFFECT_FALLBACK_ICON,
    SHEET_EFFECT_LABELS,
    SHEET_TAB_EMPTY_LABELS,
  } from '../../model';

  const emit = defineEmits<{
    'add-effect': [];
    'edit-effect': [effectId: string];
  }>();

  const { editControlClass } = useCharacterSheet();

  const {
    customEffects,
    conditionEffects,
    equipmentEffects,
    featureEffects,
    isConditionActive,
    removeEffect,
    toggleEffectDisabled,
    toggleFeatureEffectDisabled,
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
      icon: effect.icon || SHEET_EFFECT_FALLBACK_ICON,
      description:
        effect.description
        || describeActiveEffect(effect)
        || SHEET_EFFECT_LABELS.noDescription,
      disabled: effect.disabled,
      // Состояние правится плиткой, а не формой: у него нет своих настроек.
      isCondition: effect.conditionKey !== undefined,
      rowClass: effect.disabled ? 'opacity-50 grayscale' : '',
    })),
  );

  /** Строка эффекта умения: правится он только переключателем. */
  interface FeatureEffectRow {
    key: string;
    featureId: string;
    effectId: string;
    name: string;
    icon: string;
    sourceName: string;
    description: string;
    disabled: boolean;
    rowClass: string;
  }

  /**
   * Строки эффектов умений, черт, вида и класса: правке они не подлежат —
   * приезжают из справочника с самой записью, — поэтому в строке только
   * источник, описание и переключатель.
   */
  const featureRows = computed<FeatureEffectRow[]>(() =>
    featureEffects.value.map((entry) => ({
      key: `${entry.featureId}:${entry.effect.id}`,
      featureId: entry.featureId,
      effectId: entry.effect.id,
      name: entry.effect.name,
      icon: entry.effect.icon || SHEET_EFFECT_FALLBACK_ICON,
      sourceName: entry.sourceName,
      description:
        entry.effect.description
        || describeActiveEffect(entry.effect)
        || SHEET_EFFECT_LABELS.noDescription,
      disabled: entry.effect.disabled,
      rowClass: entry.effect.disabled ? 'opacity-50 grayscale' : '',
    })),
  );

  /** Плитка состояния: наложенная выделяется цветом и заливкой. */
  interface ConditionTile {
    key: EffectConditionKey;
    name: string;
    icon: string;
    description: string;
    color: ButtonProps['color'];
    variant: ButtonProps['variant'];
  }

  const conditionTiles = computed<ConditionTile[]>(() =>
    EFFECT_CONDITION_TEMPLATES.map((template) => {
      const isActive = isConditionActive(template.key);

      return {
        key: template.key,
        name: template.name,
        icon: template.icon,
        description: template.description,
        color: isActive ? 'primary' : 'neutral',
        variant: isActive ? 'soft' : 'outline',
      };
    }),
  );

  function handleAdd() {
    emit('add-effect');
  }

  function handleEdit(effectId: string) {
    emit('edit-effect', effectId);
  }

  function handleToggleFeatureEffect(row: FeatureEffectRow) {
    toggleFeatureEffectDisabled(row.featureId, row.effectId);
  }

  function handleToggleCondition(key: EffectConditionKey) {
    toggleCondition(key);
  }

  // Эффект удаляется безвозвратно — спрашиваем подтверждение, как и лист целиком.
  const removingEffectId = ref<string | null>(null);

  const isRemoveOpen = computed({
    get: () => removingEffectId.value !== null,
    set: (value) => {
      if (!value) {
        removingEffectId.value = null;
      }
    },
  });

  function handleRemove(effectId: string) {
    removingEffectId.value = effectId;
  }

  function handleRemoveConfirm() {
    if (removingEffectId.value) {
      removeEffect(removingEffectId.value);
    }

    removingEffectId.value = null;
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

          <span class="text-xs text-muted">{{ row.description }}</span>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <USwitch
            :model-value="!row.disabled"
            size="sm"
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
            :class="editControlClass"
            :aria-label="SHEET_EFFECT_LABELS.remove"
            @click.left.exact.prevent="handleRemove(row.id)"
          />
        </div>
      </div>
    </section>

    <!-- От умений и черт: снять нельзя, выключить можно -->
    <section class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-highlighted">
        {{ SHEET_EFFECT_LABELS.featureTitle }}
      </h3>

      <p
        v-if="!featureRows.length"
        class="rounded-lg border border-dashed border-default/60 px-3 py-4 text-sm text-muted"
      >
        {{ SHEET_EFFECT_LABELS.featureEmpty }}
      </p>

      <div
        v-for="row in featureRows"
        :key="row.key"
        class="flex items-start gap-2 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2"
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

          <span class="text-xs text-toned">{{ row.sourceName }}</span>

          <span class="text-xs text-muted">{{ row.description }}</span>
        </div>

        <USwitch
          :model-value="!row.disabled"
          size="sm"
          class="shrink-0"
          :aria-label="SHEET_EFFECT_LABELS.toggle"
          @update:model-value="handleToggleFeatureEffect(row)"
        />
      </div>
    </section>

    <!-- От снаряжения: только для показа -->
    <section class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-highlighted">
        {{ SHEET_EFFECT_LABELS.equipmentTitle }}
      </h3>

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
          :name="row.effect.icon || SHEET_EFFECT_FALLBACK_ICON"
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
        <UTooltip
          v-for="tile in conditionTiles"
          :key="tile.key"
          :text="tile.description"
        >
          <UButton
            :icon="tile.icon"
            :label="tile.name"
            :color="tile.color"
            :variant="tile.variant"
            size="sm"
            block
            class="justify-start"
            :class="editControlClass"
            @click.left.exact.prevent="handleToggleCondition(tile.key)"
          />
        </UTooltip>
      </div>
    </section>

    <ConfirmDialog
      v-model:open="isRemoveOpen"
      :title="SHEET_EFFECT_LABELS.removeConfirmTitle"
      :description="SHEET_EFFECT_LABELS.removeConfirmDescription"
      :confirm-label="SHEET_EFFECT_LABELS.removeConfirmApply"
      confirm-color="error"
      confirm-icon="tabler:trash"
      @confirm="handleRemoveConfirm"
    />
  </div>
</template>
