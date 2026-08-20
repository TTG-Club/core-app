<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    FeatPrerequisiteRow,
    FeatPrerequisiteRowKind,
  } from '../../model';

  import { SelectAbilities, SelectArmorCategory } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import {
    CLASS_FEATURE_ROW_OPTIONS,
    createPrerequisiteRow,
    FEAT_EDITOR_LABELS,
    FEAT_PREREQUISITE_KIND_OPTIONS,
    FEAT_PREREQUISITE_LABELS,
    FEAT_PREREQUISITE_REF_KINDS,
    isRefPrerequisite,
    isValuelessPrerequisite,
  } from '../../model';
  import FeatEntityRefRows from './FeatEntityRefRows.vue';
  import FeatRowsSeparator from './FeatRowsSeparator.vue';

  /**
   * Требования черты: одна строка — одно требование. Внутри строки значения
   * соединяются по «ИЛИ» (одна характеристика читается как «Сила 13+»,
   * несколько — как «Сила или Ловкость 13+»), сами строки — по «И».
   *
   * Требования вроде «нужно заклинательство» значений не имеют: сама строка и
   * есть требование, поэтому она рисуется компактно, без пустой колонки справа.
   */
  const model = defineModel<Array<FeatPrerequisiteRow>>({ required: true });

  /** Меню «Добавить требование». */
  const addMenuItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    FEAT_PREREQUISITE_KIND_OPTIONS.map((option) => ({
      label: option.label,
      onSelect: () => addRow(option.value),
    })),
  ]);

  /** Требования без значений: они рисуются компактной строкой. */
  const valuelessRows = computed<Array<FeatPrerequisiteRow>>(() =>
    model.value.filter((row) => isValuelessPrerequisite(row.kind)),
  );

  /** Остальные требования — со своими полями под подписью. */
  const valueRows = computed<Array<FeatPrerequisiteRow>>(() =>
    model.value.filter((row) => !isValuelessPrerequisite(row.kind)),
  );

  /** Требование свободным текстом: сеттинг либо произвольная строка. */
  function isTextRow(row: FeatPrerequisiteRow): boolean {
    return row.kind === 'CAMPAIGN' || row.kind === 'TEXT';
  }

  /**
   * Номер строки в общем списке: список разделён на две группы, а удаление
   * работает по исходному номеру.
   *
   * @param row строка требования.
   * @returns номер строки в модели.
   */
  function indexOf(row: FeatPrerequisiteRow): number {
    return model.value.indexOf(row);
  }

  /**
   * Заводит строку требования выбранного вида.
   *
   * @param kind вид требования из меню «Добавить».
   */
  function addRow(kind: FeatPrerequisiteRowKind) {
    model.value = [...model.value, createPrerequisiteRow(kind)];
  }

  /**
   * Убирает строку требования.
   *
   * @param index номер строки в общем списке, а не в своей группе.
   */
  function removeRow(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <InfoTooltip
      :text="FEAT_EDITOR_LABELS.prerequisitesHintDetails"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ FEAT_EDITOR_LABELS.prerequisitesHint }}</span>
    </InfoTooltip>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ FEAT_EDITOR_LABELS.prerequisitesEmpty }}
    </p>

    <!-- Требование без значений: одна компактная строка, а не пустая колонка -->
    <div
      v-for="row in valuelessRows"
      :key="row.uid"
      class="flex items-center gap-2 rounded-lg bg-elevated/40 px-3 py-2"
    >
      <UIcon
        name="tabler:check"
        class="size-4 shrink-0 text-primary"
      />

      <span class="min-w-0 flex-1 text-sm">
        {{ FEAT_PREREQUISITE_LABELS[row.kind] }}
      </span>

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="xs"
        :aria-label="FEAT_PREREQUISITE_LABELS[row.kind]"
        @click.left.exact.prevent="removeRow(indexOf(row))"
      />
    </div>

    <template
      v-for="(row, index) in valueRows"
      :key="row.uid"
    >
      <FeatRowsSeparator v-if="index > 0 || valuelessRows.length > 0" />

      <div class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
        <div class="flex items-center gap-2">
          <span class="min-w-0 flex-1 text-sm font-medium text-highlighted">
            {{ FEAT_PREREQUISITE_LABELS[row.kind] }}
          </span>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            :aria-label="FEAT_PREREQUISITE_LABELS[row.kind]"
            @click.left.exact.prevent="removeRow(indexOf(row))"
          />
        </div>

        <div class="grid grid-cols-1 items-end gap-3 md:grid-cols-24">
          <template v-if="row.kind === 'ABILITY'">
            <UFormField
              class="md:col-span-18"
              :label="FEAT_EDITOR_LABELS.prerequisiteAbilities"
            >
              <SelectAbilities
                v-model="row.abilities"
                multiple
              />
            </UFormField>

            <UFormField
              class="md:col-span-6"
              :label="FEAT_EDITOR_LABELS.prerequisiteMinValue"
            >
              <UInputNumber
                v-model="row.minValue"
                :min="1"
                :max="20"
              />
            </UFormField>
          </template>

          <UFormField
            v-else-if="row.kind === 'LEVEL'"
            class="md:col-span-6"
            :label="FEAT_EDITOR_LABELS.prerequisiteLevel"
          >
            <UInputNumber
              v-model="row.minValue"
              :min="1"
              :max="20"
            />
          </UFormField>

          <UFormField
            v-else-if="row.kind === 'CLASS_FEATURE'"
            class="md:col-span-full"
          >
            <USelectMenu
              v-model="row.classFeatures"
              :items="CLASS_FEATURE_ROW_OPTIONS"
              :placeholder="
                FEAT_EDITOR_LABELS.prerequisiteClassFeaturesPlaceholder
              "
              value-key="value"
              multiple
            />
          </UFormField>

          <UFormField
            v-else-if="row.kind === 'ARMOR_PROFICIENCY'"
            class="md:col-span-full"
          >
            <SelectArmorCategory
              v-model="row.armorCategories"
              multiple
            />
          </UFormField>

          <UFormField
            v-else-if="isTextRow(row)"
            class="md:col-span-full"
          >
            <UInput
              v-model="row.text"
              :placeholder="
                row.kind === 'CAMPAIGN'
                  ? FEAT_EDITOR_LABELS.prerequisiteCampaignPlaceholder
                  : FEAT_EDITOR_LABELS.prerequisiteTextPlaceholder
              "
            />
          </UFormField>

          <div
            v-else-if="isRefPrerequisite(row.kind)"
            class="md:col-span-full"
          >
            <FeatEntityRefRows
              v-model="row.refs"
              :kind="FEAT_PREREQUISITE_REF_KINDS[row.kind] ?? 'FEAT'"
            />
          </div>
        </div>
      </div>
    </template>

    <UDropdownMenu
      :items="addMenuItems"
      :content="{ align: 'start' }"
    >
      <UButton
        icon="tabler:plus"
        :label="FEAT_EDITOR_LABELS.addPrerequisite"
        color="primary"
        variant="soft"
        block
      />
    </UDropdownMenu>
  </div>
</template>
