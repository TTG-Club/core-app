<script setup lang="ts">
  import type {
    FeatEditorLabelOverrides,
    FeatSpellListExpansion,
    FeatSpellListGroup,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    createFeatSpellListGroup,
    getFeatEditorLabels,
    getFeatSpellCountLabel,
  } from '../../model';
  import FeatEntityRefRows from './FeatEntityRefRows.vue';
  import FeatRowsSeparator from './FeatRowsSeparator.vue';
  import FeatSpellCountField from './FeatSpellCountField.vue';

  /**
   * Заклинания, которые черта добавляет в список заклинаний класса — таблица
   * «Заклинания метки».
   *
   * Отдельным блоком от выдачи, потому что это другая механика: выданное
   * заклинание персонаж знает и накладывает, а отсюда — только берёт себе,
   * потратив подготовку и ячейку.
   *
   * Списков несколько: у метки дракона первая пачка открывается сразу, а
   * следующие — на своих уровнях, и из каждой берут своё количество. Складывать
   * их в один список значило бы выдать всю таблицу с первого уровня.
   */
  const model = defineModel<FeatSpellListExpansion>({ required: true });

  const { labels = {} } = defineProps<{
    /**
     * Подписи формы-владельца: чертой источник даров называет только форма
     * черты, у умения класса и вида свои формулировки.
     */
    labels?: FeatEditorLabelOverrides;
  }>();

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

  /** Заголовок списка: с какого уровня и сколько из него берут. */
  function getGroupTitle(group: FeatSpellListGroup): string {
    const level = group.requiredLevel
      ? `${texts.value.spellListFromLevelPrefix} ${group.requiredLevel} ${texts.value.spellListFromLevelSuffix}`
      : texts.value.spellListFromStart;

    return `${level} — ${getFeatSpellCountLabel(group.count)}`;
  }

  /** Заводит пустой список: уровень и количество автор задаёт сам. */
  function addGroup() {
    model.value = {
      ...model.value,
      groups: [...model.value.groups, createFeatSpellListGroup()],
    };
  }

  /**
   * Убирает список целиком вместе с его заклинаниями.
   *
   * @param index номер списка.
   */
  function removeGroup(index: number) {
    model.value = {
      ...model.value,
      groups: model.value.groups.filter((_, position) => position !== index),
    };
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <InfoTooltip
      :text="texts.spellListHintDetails"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ texts.spellListHint }}</span>
    </InfoTooltip>

    <p
      v-if="!model.groups.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ texts.spellListEmpty }}
    </p>

    <template
      v-for="(group, index) in model.groups"
      :key="index"
    >
      <FeatRowsSeparator v-if="index > 0" />

      <div
        class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/40 p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="min-w-0 truncate text-sm font-medium text-highlighted">
            {{ getGroupTitle(group) }}
          </span>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            :aria-label="getGroupTitle(group)"
            @click.left.exact.prevent="removeGroup(index)"
          />
        </div>

        <div class="flex flex-wrap items-end gap-2">
          <UFormField class="w-40">
            <template #label>
              <InfoTooltip
                :text="texts.spellListLevelHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ texts.spellListLevel }}</span>
              </InfoTooltip>
            </template>

            <UInputNumber
              v-model="group.requiredLevel"
              :min="1"
              :max="20"
              :placeholder="texts.spellListLevelPlaceholder"
            />
          </UFormField>

          <InfoTooltip
            :text="texts.spellListCountHint"
            icon="tabler:info-circle-filled"
            class="mb-2"
          >
            <span class="sr-only">
              {{ texts.spellListCount }}
            </span>
          </InfoTooltip>

          <FeatSpellCountField v-model="group.count" />
        </div>

        <FeatEntityRefRows
          v-model="group.spells"
          kind="SPELL"
        />
      </div>
    </template>

    <UButton
      icon="tabler:plus"
      :label="texts.addSpellList"
      color="primary"
      variant="soft"
      block
      @click.left.exact.prevent="addGroup"
    />

    <!-- Без заклинаний отметка ничего не описывает: расширять нечего -->
    <div
      v-if="model.groups.length"
      class="flex items-center"
    >
      <InfoTooltip
        :text="texts.spellListRequiresSpellcastingHint"
        icon="tabler:info-circle-filled"
      >
        <UCheckbox
          v-model="model.requiresSpellcasting"
          :label="texts.spellListRequiresSpellcasting"
        />
      </InfoTooltip>
    </div>
  </div>
</template>
