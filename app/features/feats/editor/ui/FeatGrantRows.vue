<script setup lang="ts">
  import type {
    FeatEditorRows,
    FeatGrantRow,
    FeatGrantRowKind,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    createGrantRow,
    FEAT_CHOICE_GRANT_OPTIONS,
    FEAT_EDITOR_LABELS,
    FEAT_GRANT_KIND_LABELS,
    FEAT_GRANT_KIND_OPTIONS,
    FEAT_GRANT_MODE_OPTIONS,
    getPrimaryGrantKind,
    getTakenChoiceKeys,
    hasGrantKind,
    isChoiceOnlyGrantRow,
    isExpertiseGrantRow,
    isGrantOnlyRow,
    isMixableGrantKind,
    isProficiencyGrantRow,
  } from '../../model';
  import FeatGrantValues from './FeatGrantValues.vue';
  import FeatOptionRows from './FeatOptionRows.vue';
  import FeatRowsSeparator from './FeatRowsSeparator.vue';

  /**
   * Дары черты: одна строка — одно, что черта даёт. Режим строки решает,
   * выдаётся ли перечисленное сразу или игрок выбирает из набора: механика у
   * этого одна, и разводить их по разным спискам значило бы дважды описывать
   * одно и то же.
   */
  const { rows } = defineProps<{
    /** Все строки редактора: из них берутся занятые ключи выборов. */
    rows: FeatEditorRows;
  }>();

  const model = defineModel<Array<FeatGrantRow>>({ required: true });

  /** У строки один вид со своим справочником — набор правит селект вида. */
  function hasDictionary(row: FeatGrantRow): boolean {
    return row.kinds.length === 1 && getPrimaryGrantKind(row) !== 'OPTION';
  }

  /** Пояснение к набору строки: у каждого случая своё. */
  function getPoolHint(row: FeatGrantRow): string {
    if (row.kinds.length > 1) {
      return FEAT_EDITOR_LABELS.poolMixedHint;
    }

    return hasDictionary(row)
      ? FEAT_EDITOR_LABELS.poolHint
      : FEAT_EDITOR_LABELS.poolCustomHint;
  }

  /** Отмеченные виды одной строкой: несколько читаются как «или». */
  function getKindsLabel(row: FeatGrantRow): string {
    return row.kinds
      .map((kind) => FEAT_GRANT_KIND_LABELS[kind])
      .join(FEAT_EDITOR_LABELS.kindSeparator);
  }

  /** Заголовок строки: что даётся и как. */
  function getRowTitle(row: FeatGrantRow): string {
    const mode = FEAT_GRANT_MODE_OPTIONS.find(
      (option) => option.value === row.mode,
    );

    return `${getKindsLabel(row)} — ${mode?.label.toLowerCase() ?? ''}`;
  }

  /**
   * Смена видов сбрасывает набор: значения заданы в справочнике прежнего вида и
   * в новом означали бы не то (навык «Проницательность» среди языков).
   *
   * @param row строка дара.
   * @param kinds отмеченные виды.
   */
  function setKinds(row: FeatGrantRow, kinds: Array<FeatGrantRowKind>) {
    const next = kinds.length ? kinds : [getPrimaryGrantKind(row)];

    // Несмешиваемый вид живёт в строке один: его значения приходят из каталога,
    // и в общей куче со справочником правил их не различить
    row.kinds = next.every(isMixableGrantKind)
      ? next
      : [next.at(-1) ?? getPrimaryGrantKind(row)];

    row.options = [];

    // Выдать «навык или инструмент» нечем: несколько видов — это всегда выбор
    if (isChoiceOnlyGrantRow(row)) {
      row.mode = 'CHOICE';
    }

    // И наоборот: категорию оружия выдают целиком, выбирать её не из чего
    if (isGrantOnlyRow(row)) {
      row.mode = 'ALL';
    }

    if (hasGrantKind(row, 'ABILITY')) {
      row.abilityBonus = row.abilityBonus ?? 1;
      row.abilityUpto = row.abilityUpto ?? 20;
    } else if (!hasGrantKind(row, 'SAVING_THROW')) {
      row.abilityBonus = undefined;
      row.abilityUpto = undefined;
    }
  }

  /**
   * Ограничения пула взаимно исключают друг друга: вместе они не оставляют, из
   * чего выбирать, поэтому включение одного снимает второе.
   *
   * @param row строка дара.
   * @param enabled новое значение отметки.
   */
  function toggleOnlyIfProficient(
    row: FeatGrantRow,
    enabled: boolean | 'indeterminate',
  ) {
    row.onlyIfProficient = enabled === true;

    if (row.onlyIfProficient) {
      row.onlyIfNotProficient = false;
    }
  }

  /**
   * Обратная отметка пула — с тем же взаимным исключением.
   *
   * @param row строка дара.
   * @param enabled новое значение отметки.
   */
  function toggleOnlyIfNotProficient(
    row: FeatGrantRow,
    enabled: boolean | 'indeterminate',
  ) {
    row.onlyIfNotProficient = enabled === true;

    if (row.onlyIfNotProficient) {
      row.onlyIfProficient = false;
    }
  }

  /** Заводит строку дара: навык — самый частый вид, с него и начинают. */
  function addRow() {
    model.value = [
      ...model.value,
      createGrantRow('SKILL', getTakenChoiceKeys(rows)),
    ];
  }

  /**
   * Убирает строку дара.
   *
   * @param index номер строки в списке.
   */
  function removeRow(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <InfoTooltip
      :text="FEAT_EDITOR_LABELS.grantsHintDetails"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ FEAT_EDITOR_LABELS.grantsHint }}</span>
    </InfoTooltip>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ FEAT_EDITOR_LABELS.grantsEmpty }}
    </p>

    <template
      v-for="(row, index) in model"
      :key="row.uid"
    >
      <FeatRowsSeparator v-if="index > 0" />

      <div
        class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/40 p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="min-w-0 truncate text-sm font-medium text-highlighted">
            {{ getRowTitle(row) }}
          </span>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            :aria-label="getRowTitle(row)"
            @click.left.exact.prevent="removeRow(index)"
          />
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-24">
          <UFormField class="md:col-span-10">
            <template #label>
              <InfoTooltip
                :text="FEAT_EDITOR_LABELS.kindHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ FEAT_EDITOR_LABELS.kind }}</span>
              </InfoTooltip>
            </template>

            <USelectMenu
              :model-value="row.kinds"
              :items="FEAT_GRANT_KIND_OPTIONS"
              :ui="{ value: 'truncate' }"
              value-key="value"
              multiple
              @update:model-value="setKinds(row, $event)"
            >
              <span class="truncate">{{ getKindsLabel(row) }}</span>
            </USelectMenu>
          </UFormField>

          <UFormField class="md:col-span-6">
            <template #label>
              <InfoTooltip
                :text="FEAT_EDITOR_LABELS.modeHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ FEAT_EDITOR_LABELS.mode }}</span>
              </InfoTooltip>
            </template>

            <USelect
              v-model="row.mode"
              :items="FEAT_GRANT_MODE_OPTIONS"
              :disabled="isChoiceOnlyGrantRow(row) || isGrantOnlyRow(row)"
              value-key="value"
            />
          </UFormField>

          <UFormField
            v-if="row.mode === 'CHOICE'"
            class="md:col-span-4"
            :label="FEAT_EDITOR_LABELS.count"
          >
            <UInputNumber
              v-model="row.count"
              :min="1"
              :max="10"
              :disabled="row.countEqualsProficiencyBonus"
            />
          </UFormField>

          <div
            v-if="row.mode === 'CHOICE'"
            class="flex items-center md:col-span-4 md:self-end md:pb-2"
          >
            <InfoTooltip
              :text="FEAT_EDITOR_LABELS.countEqualsProficiencyBonusHint"
              icon="tabler:info-circle-filled"
            >
              <UCheckbox
                v-model="row.countEqualsProficiencyBonus"
                :label="FEAT_EDITOR_LABELS.countEqualsProficiencyBonus"
              />
            </InfoTooltip>
          </div>

          <UFormField class="md:col-span-full">
            <template #label>
              <InfoTooltip
                :text="getPoolHint(row)"
                icon="tabler:info-circle-filled"
              >
                <span>
                  {{
                    row.mode === 'ALL'
                      ? FEAT_EDITOR_LABELS.values
                      : FEAT_EDITOR_LABELS.pool
                  }}
                </span>
              </InfoTooltip>
            </template>

            <FeatGrantValues
              v-if="hasDictionary(row)"
              v-model="row.options"
              :kind="getPrimaryGrantKind(row)"
            />

            <FeatOptionRows
              v-else
              v-model="row.options"
            />
          </UFormField>

          <template v-if="row.mode === 'CHOICE'">
            <UFormField
              class="md:col-span-full"
              :label="FEAT_EDITOR_LABELS.label"
            >
              <UInput
                v-model="row.label"
                :placeholder="FEAT_EDITOR_LABELS.labelPlaceholder"
              />
            </UFormField>

            <UFormField
              v-if="isExpertiseGrantRow(row)"
              class="md:col-span-6"
              :label="FEAT_EDITOR_LABELS.grants"
            >
              <USelect
                v-model="row.grants"
                :items="FEAT_CHOICE_GRANT_OPTIONS"
                value-key="value"
              />
            </UFormField>

            <div
              v-if="isProficiencyGrantRow(row)"
              class="flex flex-wrap items-center gap-4 md:col-span-full"
            >
              <UCheckbox
                :model-value="row.onlyIfNotProficient"
                :label="FEAT_EDITOR_LABELS.onlyIfNotProficient"
                @update:model-value="toggleOnlyIfNotProficient(row, $event)"
              />

              <UCheckbox
                :model-value="row.onlyIfProficient"
                :label="FEAT_EDITOR_LABELS.onlyIfProficient"
                @update:model-value="toggleOnlyIfProficient(row, $event)"
              />

              <UCheckbox
                v-if="isExpertiseGrantRow(row)"
                v-model="row.expertiseIfProficient"
                :label="FEAT_EDITOR_LABELS.expertiseIfProficient"
              />
            </div>

            <div class="flex flex-wrap items-center gap-4 md:col-span-full">
              <UCheckbox
                v-model="row.rechooseOnLongRest"
                :label="FEAT_EDITOR_LABELS.rechooseOnLongRest"
              />
            </div>
          </template>

          <!-- Повышение характеристики: и у фиксированного дара, и у выбора -->
          <template
            v-if="
              hasGrantKind(row, 'ABILITY') || hasGrantKind(row, 'SAVING_THROW')
            "
          >
            <UFormField
              class="md:col-span-5"
              :label="FEAT_EDITOR_LABELS.abilityBonus"
            >
              <UInputNumber
                v-model="row.abilityBonus"
                :min="0"
                :max="5"
              />
            </UFormField>

            <UFormField
              class="md:col-span-5"
              :label="FEAT_EDITOR_LABELS.abilityUpto"
            >
              <UInputNumber
                v-model="row.abilityUpto"
                :min="0"
                :max="30"
              />
            </UFormField>

            <p class="text-xs text-dimmed md:col-span-full">
              {{ FEAT_EDITOR_LABELS.abilityHint }}
            </p>
          </template>
        </div>
      </div>
    </template>

    <UButton
      icon="tabler:plus"
      :label="FEAT_EDITOR_LABELS.addGrant"
      color="primary"
      variant="soft"
      block
      @click.left.exact.prevent="addRow"
    />
  </div>
</template>
