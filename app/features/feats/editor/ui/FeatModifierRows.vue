<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    FeatEditorLabelOverrides,
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
    FEAT_MODIFIER_KIND_OPTIONS,
    FEAT_MODIFIER_LABELS,
    FEAT_MODIFIER_SOURCE_OPTIONS,
    getFeatEditorLabels,
    getTakenChoiceKeys,
    hasModifierValue,
    isDamageDefenseChoiceRow,
    isFixedDamageDefenseRow,
    supportsEqualsWalk,
  } from '../../model';
  import FeatRowsSection from './FeatRowsSection.vue';

  /**
   * Постоянные правки листа: одна строка — одна правка. Список видов живёт в
   * меню «Добавить», а строка рисует только свои поля — плоская сетка держала
   * на экране все чувства и все скорости сразу, и почти все поля в ней у
   * обычной черты пустовали.
   */
  const {
    rows,
    labels = {},
    title = undefined,
  } = defineProps<{
    /** Все строки редактора: из них берутся занятые ключи выборов. */
    rows: FeatEditorRows;

    /**
     * Подписи формы-владельца: чертой источник даров называет только форма
     * черты, у умения класса и вида свои формулировки.
     */
    labels?: FeatEditorLabelOverrides;

    /**
     * Заголовок блока: с ним строки рисуются в рамке с кнопкой добавления в
     * шапке. Пусто — форма-владелец рисует заголовок сама.
     */
    title?: string;
  }>();

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

  const model = defineModel<Array<FeatModifierRow>>({ required: true });

  /** Блок в рамке с заголовком: кнопка добавления живёт в его шапке. */
  const isCompact = computed(() => Boolean(title));

  /** Размер кнопки добавления: в шапке рамки она мельче, чем под списком. */
  const addButtonSize = computed<'xs' | 'md'>(() =>
    isCompact.value ? 'xs' : 'md',
  );

  /** В шапке кнопка не тянется и не сжимается, под списком — во всю ширину. */
  const addButtonClass = computed(() => (isCompact.value ? 'shrink-0' : ''));

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
  <FeatRowsSection
    :title="title"
    :summary="texts.modifiersHint"
    :hint="texts.modifiersHintDetails"
    :empty="texts.modifiersEmpty"
    :count="model.length"
  >
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
          :aria-label="texts.modifierValue"
        />

        <UCheckbox
          v-if="supportsEqualsWalk(row.kind)"
          v-model="row.equalsWalk"
          :label="texts.equalsWalk"
        />

        <InfoTooltip
          v-if="row.kind === 'DAMAGE_DEFENSE'"
          :text="texts.damageTypeSourceHint"
          icon="tabler:info-circle-filled"
        >
          <USelect
            v-model="row.source"
            :items="FEAT_MODIFIER_SOURCE_OPTIONS"
            value-key="value"
            class="w-44"
            :aria-label="texts.damageTypeSource"
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
          :aria-label="texts.defenseKind"
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
              :text="texts.damageTypesPoolHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ texts.damageTypesPool }}</span>
            </InfoTooltip>
          </template>

          <SelectDamageType
            v-model="row.damageTypes"
            multiple
          />
        </UFormField>

        <UFormField
          class="md:col-span-4"
          :label="texts.damageChoiceCount"
        >
          <UInputNumber
            v-model="row.count"
            :min="FEAT_DAMAGE_CHOICE_COUNT.min"
            :max="FEAT_DAMAGE_CHOICE_COUNT.max"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          :label="texts.damageChoiceLabel"
        >
          <UInput
            v-model="row.label"
            :placeholder="texts.damageChoiceLabelPlaceholder"
          />
        </UFormField>
      </div>
    </div>

    <!-- Кнопка добавления своя: вид модификатора выбирают меню, а не строкой -->
    <template #add>
      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'start' }"
        :class="addButtonClass"
      >
        <UButton
          icon="tabler:plus"
          :label="texts.addModifier"
          color="primary"
          variant="soft"
          :size="addButtonSize"
          :block="!isCompact"
        />
      </UDropdownMenu>
    </template>
  </FeatRowsSection>
</template>
