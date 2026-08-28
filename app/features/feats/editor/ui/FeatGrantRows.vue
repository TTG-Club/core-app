<script setup lang="ts">
  import type {
    FeatEditorLabelOverrides,
    FeatEditorRows,
    FeatGrantRow,
    FeatGrantRowKind,
  } from '../../model';

  import { SelectFeatCategory } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import {
    CHOICE_COUNT_MAX,
    CHOICE_COUNT_MIN,
    CLASS_LEVEL_MAX,
    CLASS_LEVEL_MIN,
    createGrantRow,
    FEAT_CHOICE_GRANT_OPTIONS,
    FEAT_GRANT_KIND_LABELS,
    FEAT_GRANT_KIND_OPTIONS,
    FEAT_GRANT_MODE_OPTIONS,
    getFeatEditorLabels,
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
  import FeatRowsSection from './FeatRowsSection.vue';
  import FeatRowsSeparator from './FeatRowsSeparator.vue';

  /**
   * Дары: одна строка — одно, что даётся. Режим строки решает, выдаётся ли
   * перечисленное сразу или игрок выбирает из набора: механика у этого одна,
   * и разводить их по разным спискам значило бы дважды описывать одно и то же.
   *
   * Редактор общий для черты, умения класса, вида и предыстории: набор даров у
   * них один. Кто источник даров, форма-владелец называет своими подписями.
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

  const model = defineModel<Array<FeatGrantRow>>({ required: true });

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

  /** У строки один вид со своим справочником — набор правит селект вида. */
  function hasDictionary(row: FeatGrantRow): boolean {
    return row.kinds.length === 1 && getPrimaryGrantKind(row) !== 'OPTION';
  }

  /** Строка выдаёт черту: у неё свой пул — категории каталога черт. */
  function isFeatRow(row: FeatGrantRow): boolean {
    return row.kinds.length === 1 && getPrimaryGrantKind(row) === 'FEAT';
  }

  /** Пояснение к набору строки: у каждого случая своё. */
  function getPoolHint(row: FeatGrantRow): string {
    if (row.kinds.length > 1) {
      return texts.value.poolMixedHint;
    }

    if (isFeatRow(row)) {
      return row.mode === 'ALL'
        ? texts.value.featValuesHint
        : texts.value.featPoolHint;
    }

    return hasDictionary(row)
      ? texts.value.poolHint
      : texts.value.poolCustomHint;
  }

  /** Отмеченные виды одной строкой: несколько читаются как «или». */
  function getKindsLabel(row: FeatGrantRow): string {
    return row.kinds
      .map((kind) => FEAT_GRANT_KIND_LABELS[kind])
      .join(texts.value.kindSeparator);
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

    // Категории черт имеют смысл только у выбора черты
    if (!hasGrantKind(row, 'FEAT')) {
      row.featCategories = [];
    }

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
   * Записывает категории черт выбора. Перечисленные черты сбрасываются: они
   * выбирались в прежних категориях, и в новых их могло бы не быть.
   *
   * @param row строка дара.
   * @param categories отмеченные категории.
   */
  function setFeatCategories(
    row: FeatGrantRow,
    categories: string | Array<string> | undefined,
  ) {
    if (Array.isArray(categories)) {
      row.featCategories = categories;
    } else {
      row.featCategories = categories ? [categories] : [];
    }

    row.options = [];
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
   * Заводит ступень роста: следующая начинается уровнем позже последней и даёт
   * на один выбор больше.
   *
   * @param row строка дара.
   */
  function addScaling(row: FeatGrantRow) {
    const last = row.scaling.at(-1);

    row.scaling = [
      ...row.scaling,
      {
        level: Math.min(CLASS_LEVEL_MAX, (last?.level ?? 0) + 1),
        count: Math.min(CHOICE_COUNT_MAX, (last?.count ?? row.count ?? 0) + 1),
      },
    ];
  }

  /**
   * Убирает ступень роста.
   *
   * @param row строка дара.
   * @param index номер ступени.
   */
  function removeScaling(row: FeatGrantRow, index: number) {
    row.scaling = row.scaling.filter((_, position) => position !== index);
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
  <FeatRowsSection
    :title="title"
    :summary="texts.grantsHint"
    :hint="texts.grantsHintDetails"
    :empty="texts.grantsEmpty"
    :count="model.length"
    :add-label="texts.addGrant"
    @add="addRow"
  >
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
                :text="texts.kindHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ texts.kind }}</span>
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
                :text="texts.modeHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ texts.mode }}</span>
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
            :label="texts.count"
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
              :text="texts.countEqualsProficiencyBonusHint"
              icon="tabler:info-circle-filled"
            >
              <UCheckbox
                v-model="row.countEqualsProficiencyBonus"
                :label="texts.countEqualsProficiencyBonus"
              />
            </InfoTooltip>
          </div>

          <!-- Категории черт: пул выбора черты задаётся ими, а перечисление
            ниже только сужает его. У выдачи без выбора категорий нет —
            выдаются перечисленные черты -->
          <UFormField
            v-if="isFeatRow(row) && row.mode === 'CHOICE'"
            class="md:col-span-full"
          >
            <template #label>
              <InfoTooltip
                :text="texts.featCategoriesHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ texts.featCategories }}</span>
              </InfoTooltip>
            </template>

            <SelectFeatCategory
              :model-value="row.featCategories"
              multiple
              @update:model-value="setFeatCategories(row, $event)"
            />
          </UFormField>

          <UFormField class="md:col-span-full">
            <template #label>
              <InfoTooltip
                :text="getPoolHint(row)"
                icon="tabler:info-circle-filled"
              >
                <span>
                  {{ row.mode === 'ALL' ? texts.values : texts.pool }}
                </span>
              </InfoTooltip>
            </template>

            <FeatGrantValues
              v-if="hasDictionary(row)"
              v-model="row.options"
              :kind="getPrimaryGrantKind(row)"
              :feat-categories="row.featCategories"
            />

            <FeatOptionRows
              v-else
              v-model="row.options"
            />
          </UFormField>

          <template v-if="row.mode === 'CHOICE'">
            <UFormField
              class="md:col-span-full"
              :label="texts.label"
            >
              <UInput
                v-model="row.label"
                :placeholder="texts.labelPlaceholder"
              />
            </UFormField>

            <UFormField
              v-if="isExpertiseGrantRow(row)"
              class="md:col-span-6"
              :label="texts.grants"
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
                :label="texts.onlyIfNotProficient"
                @update:model-value="toggleOnlyIfNotProficient(row, $event)"
              />

              <UCheckbox
                :model-value="row.onlyIfProficient"
                :label="texts.onlyIfProficient"
                @update:model-value="toggleOnlyIfProficient(row, $event)"
              />

              <UCheckbox
                v-if="isExpertiseGrantRow(row)"
                v-model="row.expertiseIfProficient"
                :label="texts.expertiseIfProficient"
              />
            </div>

            <div class="flex flex-wrap items-end gap-4 md:col-span-full">
              <UCheckbox
                v-model="row.rechooseOnLongRest"
                :label="texts.rechooseOnLongRest"
              />

              <UFormField class="w-40">
                <template #label>
                  <InfoTooltip
                    :text="texts.choiceRequiredLevelHint"
                    icon="tabler:info-circle-filled"
                  >
                    <span>{{ texts.choiceRequiredLevel }}</span>
                  </InfoTooltip>
                </template>

                <UInputNumber
                  v-model="row.requiredLevel"
                  :min="1"
                  :max="20"
                  class="w-full"
                  :aria-label="texts.choiceRequiredLevel"
                />
              </UFormField>
            </div>

            <!-- Рост по уровням: оружейных приёмов у воина три с первого уровня,
              четыре с четвёртого, пять с десятого. Ступень называет, сколько
              всего выбрано к этому уровню, а не сколько добавилось -->
            <div class="flex flex-col gap-2 md:col-span-full">
              <span class="text-xs font-medium text-muted">
                {{ texts.choiceScalingTitle }}
              </span>

              <p
                v-if="!row.scaling.length"
                class="text-xs text-dimmed italic"
              >
                {{ texts.choiceScalingEmpty }}
              </p>

              <div
                v-for="(step, stepIndex) in row.scaling"
                :key="`${row.uid}-${stepIndex}`"
                class="flex items-end gap-2"
              >
                <UFormField
                  class="w-28"
                  :label="texts.choiceScalingLevel"
                >
                  <UInputNumber
                    v-model="step.level"
                    :min="CLASS_LEVEL_MIN"
                    :max="CLASS_LEVEL_MAX"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  class="w-28"
                  :label="texts.choiceScalingCount"
                >
                  <UInputNumber
                    v-model="step.count"
                    :min="CHOICE_COUNT_MIN"
                    :max="CHOICE_COUNT_MAX"
                    class="w-full"
                  />
                </UFormField>

                <UButton
                  icon="tabler:trash"
                  color="error"
                  variant="ghost"
                  size="xs"
                  :aria-label="texts.choiceScalingTitle"
                  @click.left.exact.prevent="removeScaling(row, stepIndex)"
                />
              </div>

              <UButton
                icon="tabler:plus"
                :label="texts.addChoiceScaling"
                color="neutral"
                variant="soft"
                size="xs"
                class="self-start"
                @click.left.exact.prevent="addScaling(row)"
              />
            </div>

            <!-- Ряд по уровням справочник соберёт сам: у выбора он уже задан
              ступенями, и колонкой его набирают не второй раз -->
            <div
              v-if="row.scaling.length"
              class="flex flex-wrap items-end gap-4 md:col-span-full"
            >
              <UCheckbox
                v-model="row.showInTable"
                :label="texts.choiceShowInTable"
                :description="texts.choiceShowInTableHint"
              />

              <UFormField
                v-if="row.showInTable"
                class="w-56"
                :label="texts.choiceShortName"
                :help="texts.choiceShortNameHint"
              >
                <UInput
                  v-model="row.shortName"
                  placeholder="Приёмы"
                />
              </UFormField>
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
              :label="texts.abilityBonus"
            >
              <UInputNumber
                v-model="row.abilityBonus"
                :min="0"
                :max="5"
              />
            </UFormField>

            <UFormField
              class="md:col-span-5"
              :label="texts.abilityUpto"
            >
              <UInputNumber
                v-model="row.abilityUpto"
                :min="0"
                :max="30"
              />
            </UFormField>

            <p class="text-xs text-dimmed md:col-span-full">
              {{ texts.abilityHint }}
            </p>
          </template>
        </div>
      </div>
    </template>
  </FeatRowsSection>
</template>
