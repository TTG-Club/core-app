<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    FeatEditorRows,
    FeatModifierRow,
    FeatModifierRowKind,
  } from '../../model';

  import {
    SelectCondition,
    SelectCreatureType,
    SelectDamageType,
  } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import {
    createModifierRow,
    FEAT_DAMAGE_CHOICE_COUNT,
    FEAT_DAMAGE_DEFENSE_OPTIONS,
    FEAT_EDITOR_LABELS,
    FEAT_MODIFIER_KIND_OPTIONS,
    FEAT_MODIFIER_LABELS,
    FEAT_MODIFIER_SOURCE_OPTIONS,
    getTakenChoiceKeys,
    hasModifierValue,
    isDamageDefenseChoiceRow,
    isFixedDamageDefenseRow,
    supportsEqualsWalk,
  } from '../../model';

  /**
   * Постоянные правки листа: одна строка — одна правка. Список видов живёт в
   * меню «Добавить», а строка рисует только свои поля — плоская сетка держала
   * на экране все чувства и все скорости сразу, и почти все поля в ней у
   * обычной черты пустовали.
   */
  const { rows } = defineProps<{
    /** Все строки редактора: из них берутся занятые ключи выборов. */
    rows: FeatEditorRows;
  }>();

  const model = defineModel<Array<FeatModifierRow>>({ required: true });

  /** Меню «Добавить модификатор»: все виды одним списком. */
  const addMenuItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    FEAT_MODIFIER_KIND_OPTIONS.map((option) => ({
      label: option.label,
      onSelect: () => addRow(option.value),
    })),
  ]);

  /**
   * Заводит строку модификатора выбранного вида.
   *
   * @param kind вид модификатора из меню «Добавить».
   */
  function addRow(kind: FeatModifierRowKind) {
    model.value = [
      ...model.value,
      createModifierRow(kind, getTakenChoiceKeys(rows)),
    ];
  }

  /**
   * Убирает строку модификатора.
   *
   * @param index номер строки в списке.
   */
  function removeRow(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <InfoTooltip
      :text="FEAT_EDITOR_LABELS.modifiersHintDetails"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ FEAT_EDITOR_LABELS.modifiersHint }}</span>
    </InfoTooltip>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ FEAT_EDITOR_LABELS.modifiersEmpty }}
    </p>

    <div
      v-for="(row, index) in model"
      :key="row.uid"
      class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-2"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="min-w-40 flex-1 truncate text-sm">
          {{ FEAT_MODIFIER_LABELS[row.kind] }}
        </span>

        <UInputNumber
          v-if="hasModifierValue(row.kind) && !row.equalsWalk"
          v-model="row.value"
          class="w-32"
          :aria-label="FEAT_EDITOR_LABELS.modifierValue"
        />

        <UCheckbox
          v-if="supportsEqualsWalk(row.kind)"
          v-model="row.equalsWalk"
          :label="FEAT_EDITOR_LABELS.equalsWalk"
        />

        <InfoTooltip
          v-if="row.kind === 'DAMAGE_DEFENSE'"
          :text="FEAT_EDITOR_LABELS.damageTypeSourceHint"
          icon="tabler:info-circle-filled"
        >
          <USelect
            v-model="row.source"
            :items="FEAT_MODIFIER_SOURCE_OPTIONS"
            value-key="value"
            class="w-44"
            :aria-label="FEAT_EDITOR_LABELS.damageTypeSource"
          />
        </InfoTooltip>

        <SelectDamageType
          v-if="isFixedDamageDefenseRow(row)"
          v-model="row.damageType"
          class="w-48"
        />

        <USelect
          v-if="row.kind === 'DAMAGE_DEFENSE'"
          v-model="row.defenseKind"
          :items="FEAT_DAMAGE_DEFENSE_OPTIONS"
          value-key="value"
          class="w-44"
          :aria-label="FEAT_EDITOR_LABELS.defenseKind"
        />

        <SelectCondition
          v-if="row.kind === 'CONDITION_IMMUNITY'"
          v-model="row.condition"
          class="w-56"
        />

        <SelectCreatureType
          v-if="row.kind === 'CREATURE_TYPE'"
          v-model="row.creatureType"
          class="w-56"
        />

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="FEAT_MODIFIER_LABELS[row.kind]"
          @click.left.exact.prevent="removeRow(index)"
        />
      </div>

      <!-- Настройки выбора: набор, количество и подпись пикера на листе -->
      <div
        v-if="isDamageDefenseChoiceRow(row)"
        class="grid grid-cols-1 gap-3 md:grid-cols-24"
      >
        <UFormField class="md:col-span-12">
          <template #label>
            <InfoTooltip
              :text="FEAT_EDITOR_LABELS.damageTypesPoolHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ FEAT_EDITOR_LABELS.damageTypesPool }}</span>
            </InfoTooltip>
          </template>

          <SelectDamageType
            v-model="row.damageTypes"
            multiple
          />
        </UFormField>

        <UFormField
          class="md:col-span-4"
          :label="FEAT_EDITOR_LABELS.damageChoiceCount"
        >
          <UInputNumber
            v-model="row.count"
            :min="FEAT_DAMAGE_CHOICE_COUNT.min"
            :max="FEAT_DAMAGE_CHOICE_COUNT.max"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          :label="FEAT_EDITOR_LABELS.damageChoiceLabel"
        >
          <UInput
            v-model="row.label"
            :placeholder="FEAT_EDITOR_LABELS.damageChoiceLabelPlaceholder"
          />
        </UFormField>
      </div>
    </div>

    <UDropdownMenu
      :items="addMenuItems"
      :content="{ align: 'start' }"
    >
      <UButton
        icon="tabler:plus"
        :label="FEAT_EDITOR_LABELS.addModifier"
        color="primary"
        variant="soft"
        block
      />
    </UDropdownMenu>
  </div>
</template>
