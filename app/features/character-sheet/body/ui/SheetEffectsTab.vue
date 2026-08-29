<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import type { EffectConditionKey } from '~active-effects/model';

  import type { EffectSourceGroup } from '../../model';

  import {
    describeActiveEffect,
    EFFECT_CONDITION_TEMPLATES,
  } from '~active-effects/model';
  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useCharacterSheet, useSheetActiveEffects } from '../../composables';
  import {
    EFFECT_SOURCE_GROUP_HINTS,
    EFFECT_SOURCE_GROUP_LABELS,
    EFFECT_SOURCE_GROUP_ORDER,
    getFilterChipClass,
    SHEET_EFFECT_FALLBACK_ICON,
    SHEET_EFFECT_LABELS,
    SHEET_FILTER_LABELS,
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
   * Строка списка эффектов. Что со строкой можно сделать, зависит от источника:
   * своё снимают и правят, эффект умения только выключают, эффект снаряжения не
   * трогают вовсе — он уйдёт вместе с предметом.
   */
  interface EffectRow {
    key: string;
    name: string;
    icon: string;
    description: string;
    sourceGroup: EffectSourceGroup;
    sourceLabel: string;
    disabled: boolean;
    rowClass: string;

    /** Идентификатор своего эффекта: по нему его правят и удаляют. */
    effectId: string | null;

    /** Идентификатор умения-источника: по нему эффект выключают. */
    featureId: string | null;

    /** Эффект можно выключить, не снимая: у снаряжения и этого нельзя. */
    canToggle: boolean;

    /**
     * Эффект правится формой. Состояние — нет: его накладывают плиткой, и
     * своих настроек у него не бывает.
     */
    canEdit: boolean;

    /** Эффект можно снять с листа: только своё, чужое уйдёт с источником. */
    canRemove: boolean;
  }

  /** Свои эффекты и состояния: для листа это одно и то же. */
  const ownRows = computed<EffectRow[]>(() =>
    [...conditionEffects.value, ...customEffects.value].map((effect) => ({
      key: `own:${effect.id}`,
      name: effect.name,
      icon: effect.icon || SHEET_EFFECT_FALLBACK_ICON,
      description:
        effect.description
        || describeActiveEffect(effect)
        || SHEET_EFFECT_LABELS.noDescription,
      sourceGroup: 'own',
      sourceLabel: EFFECT_SOURCE_GROUP_LABELS.own,
      disabled: effect.disabled,
      rowClass: effect.disabled ? 'opacity-50 grayscale' : '',
      effectId: effect.id,
      featureId: null,
      canToggle: true,
      // Состояние накладывают плиткой: формы у него нет, править нечего
      canEdit: effect.conditionKey === undefined,
      canRemove: true,
    })),
  );

  /** Эффекты умений, черт, вида и класса: правке они не подлежат. */
  const featureRows = computed<EffectRow[]>(() =>
    featureEffects.value.map((entry) => ({
      key: `feature:${entry.featureId}:${entry.effect.id}`,
      name: entry.effect.name,
      icon: entry.effect.icon || SHEET_EFFECT_FALLBACK_ICON,
      description:
        entry.effect.description
        || describeActiveEffect(entry.effect)
        || SHEET_EFFECT_LABELS.noDescription,
      sourceGroup: 'feature',
      sourceLabel: entry.sourceName,
      disabled: entry.effect.disabled,
      rowClass: entry.effect.disabled ? 'opacity-50 grayscale' : '',
      effectId: entry.effect.id,
      featureId: entry.featureId,
      canToggle: true,
      canEdit: false,
      canRemove: false,
    })),
  );

  /** Эффекты надетого снаряжения: только для показа. */
  const equipmentRows = computed<EffectRow[]>(() =>
    equipmentEffects.value.map((entry) => ({
      key: `equipment:${entry.sourceName}:${entry.effect.id}`,
      name: entry.effect.name,
      icon: entry.effect.icon || SHEET_EFFECT_FALLBACK_ICON,
      description:
        entry.effect.description
        || describeActiveEffect(entry.effect)
        || SHEET_EFFECT_LABELS.noDescription,
      sourceGroup: 'equipment',
      sourceLabel: entry.sourceName,
      disabled: false,
      rowClass: '',
      effectId: null,
      featureId: null,
      canToggle: false,
      canEdit: false,
      canRemove: false,
    })),
  );

  /** Все эффекты листа одним списком, в порядке источников. */
  const allRows = computed<EffectRow[]>(() => [
    ...ownRows.value,
    ...featureRows.value,
    ...equipmentRows.value,
  ]);

  /** Отмеченные чипами источники; пусто — список не сужается. */
  const pickedSources = ref(new Set<EffectSourceGroup>());

  /** Источники, которые в списке есть: по ним и отбирают. */
  const availableSources = computed<EffectSourceGroup[]>(() => {
    const present = new Set(allRows.value.map((row) => row.sourceGroup));

    return EFFECT_SOURCE_GROUP_ORDER.filter((group) => present.has(group));
  });

  /**
   * Действующий отбор: источники считаются от доступных, поэтому выбор,
   * которого в списке уже нет, сам собой перестаёт его сужать.
   */
  const activeSources = computed<EffectSourceGroup[]>(() =>
    availableSources.value.filter((group) => pickedSources.value.has(group)),
  );

  /** Список сужен: отбор есть что сбросить. */
  const hasActiveFilter = computed(() => activeSources.value.length > 0);

  /** Ряд отбора: одного источника на весь список мало, отбирать нечего. */
  const hasFilterControls = computed(() => availableSources.value.length > 1);

  const sourceChips = computed(() =>
    availableSources.value.map((group) => {
      const isPicked = activeSources.value.includes(group);

      return {
        group,
        label: EFFECT_SOURCE_GROUP_LABELS[group],
        tooltip: EFFECT_SOURCE_GROUP_HINTS[group],
        isPicked,
        chipClass: getFilterChipClass(isPicked),
      };
    }),
  );

  const displayRows = computed(() => {
    if (!activeSources.value.length) {
      return allRows.value;
    }

    return allRows.value.filter((row) =>
      activeSources.value.includes(row.sourceGroup),
    );
  });

  /** Эффектов нет вовсе: показывать нечего — ни списка, ни отбора. */
  const isEmpty = computed(() => !allRows.value.length);

  /** Подпись пустого места: у пустого листа и у пустого отбора она разная. */
  const emptyLabel = computed(() =>
    isEmpty.value ? SHEET_TAB_EMPTY_LABELS.effects : SHEET_FILTER_LABELS.empty,
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

  /** Нажатие на чип источника: тем же чипом источник с отбора и снимается. */
  function handleSourcePick(group: EffectSourceGroup) {
    if (pickedSources.value.has(group)) {
      pickedSources.value.delete(group);

      return;
    }

    pickedSources.value.add(group);
  }

  /** Нажатие на «Сбросить»: список возвращается целиком. */
  function handleFilterReset() {
    pickedSources.value.clear();
  }

  /** Открывает форму нового эффекта. */
  function handleAdd() {
    emit('add-effect');
  }

  /**
   * Правка своего эффекта. Идентификатор проверяется здесь, а не условием в
   * шаблоне: у строки умения и снаряжения его нет.
   *
   * @param row строка списка.
   */
  function handleEdit(row: EffectRow) {
    if (row.effectId) {
      emit('edit-effect', row.effectId);
    }
  }

  /**
   * Переключатель строки: свой эффект выключается по своему идентификатору,
   * эффект умения — по паре «умение + эффект».
   *
   * @param row строка списка.
   */
  function handleToggle(row: EffectRow) {
    if (row.featureId && row.effectId) {
      toggleFeatureEffectDisabled(row.featureId, row.effectId);

      return;
    }

    if (row.effectId) {
      toggleEffectDisabled(row.effectId);
    }
  }

  /**
   * Наложение или снятие состояния плиткой.
   *
   * @param key ключ состояния.
   */
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

  /**
   * Снятие своего эффекта: спрашиваем подтверждение, удаление безвозвратно.
   *
   * @param row строка списка.
   */
  function handleRemove(row: EffectRow) {
    if (row.effectId) {
      removingEffectId.value = row.effectId;
    }
  }

  /** Подтверждённое снятие эффекта. */
  function handleRemoveConfirm() {
    if (removingEffectId.value) {
      removeEffect(removingEffectId.value);
    }

    removingEffectId.value = null;
  }
</script>

<template>
  <div class="flex flex-col gap-4 pt-2">
    <section class="flex flex-col gap-2">
      <!-- Отбор стоит в одном ряду с «Добавить», как на вкладке особенностей:
        своей строки ряд из трёх коротких чипов не стоит -->
      <div class="flex flex-wrap items-center gap-2">
        <div
          v-if="hasFilterControls"
          class="flex flex-wrap items-center gap-x-1.5 gap-y-2"
        >
          <UTooltip
            v-for="sourceChip in sourceChips"
            :key="sourceChip.group"
            :text="sourceChip.tooltip"
          >
            <button
              type="button"
              :class="sourceChip.chipClass"
              :aria-pressed="sourceChip.isPicked"
              @click.left.exact.prevent="handleSourcePick(sourceChip.group)"
            >
              {{ sourceChip.label }}
            </button>
          </UTooltip>

          <UTooltip
            v-if="hasActiveFilter"
            :text="SHEET_FILTER_LABELS.resetHint"
          >
            <UButton
              icon="tabler:filter-off"
              :label="SHEET_FILTER_LABELS.reset"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="handleFilterReset"
            />
          </UTooltip>
        </div>

        <UButton
          icon="tabler:plus"
          :label="SHEET_EFFECT_LABELS.add"
          color="neutral"
          variant="ghost"
          size="sm"
          class="ml-auto"
          :class="editControlClass"
          @click.left.exact.prevent="handleAdd"
        />
      </div>

      <p
        v-if="!displayRows.length"
        class="rounded-lg border border-dashed border-default/60 px-3 py-4 text-sm text-muted"
      >
        {{ emptyLabel }}
      </p>

      <div
        v-for="row in displayRows"
        :key="row.key"
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

          <span class="text-xs text-toned">{{ row.sourceLabel }}</span>

          <span class="text-xs text-muted">{{ row.description }}</span>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <USwitch
            v-if="row.canToggle"
            :model-value="!row.disabled"
            size="sm"
            :aria-label="SHEET_EFFECT_LABELS.toggle"
            @update:model-value="handleToggle(row)"
          />

          <UButton
            v-if="row.canEdit"
            icon="tabler:pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :class="editControlClass"
            :aria-label="SHEET_EFFECT_LABELS.edit"
            @click.left.exact.prevent="handleEdit(row)"
          />

          <UButton
            v-if="row.canRemove"
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            square
            :class="editControlClass"
            :aria-label="SHEET_EFFECT_LABELS.remove"
            @click.left.exact.prevent="handleRemove(row)"
          />
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
            size="lg"
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
