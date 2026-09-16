<script setup lang="ts">
  import type {
    FeatEditorLabelOverrides,
    FeatSpellListExpansion,
    FeatSpellListGroup,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    CLASS_LEVEL_MAX,
    CLASS_LEVEL_MIN,
    createFeatSpellListGroup,
    getFeatEditorLabels,
  } from '../../model';
  import FeatEntityRefRows from './FeatEntityRefRows.vue';
  import FeatRowsSection from './FeatRowsSection.vue';
  import FeatRowsSeparator from './FeatRowsSeparator.vue';

  /**
   * Заклинания, которые черта добавляет в список заклинаний класса — таблица
   * «Заклинания метки».
   *
   * Отдельным блоком от выдачи, потому что это другая механика: выданное
   * заклинание персонаж знает и накладывает, а отсюда он лишь может выучить или
   * подготовить, как любое заклинание своего класса. Количества здесь нет:
   * «выбрать N из перечисленных» — это выбор заклинаний с перечисленным пулом.
   *
   * Списков несколько: у метки дракона первая пачка открывается сразу, а
   * следующие — на своих уровнях. Складывать их в один список значило бы
   * открыть всю таблицу с первого уровня.
   */
  const { labels = {}, title = undefined } = defineProps<{
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

  const model = defineModel<FeatSpellListExpansion>({ required: true });

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

  /** Заголовок списка: с какого уровня он открывается. */
  function getGroupTitle(group: FeatSpellListGroup): string {
    return group.requiredLevel
      ? `${texts.value.spellListFromLevelPrefix} ${group.requiredLevel} ${texts.value.spellListFromLevelSuffix}`
      : texts.value.spellListFromStart;
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
  <FeatRowsSection
    :title="title"
    :summary="texts.spellListHint"
    :hint="texts.spellListHintDetails"
    :empty="texts.spellListEmpty"
    :count="model.groups.length"
    :add-label="texts.addSpellList"
    @add="addGroup"
  >
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
              :min="CLASS_LEVEL_MIN"
              :max="CLASS_LEVEL_MAX"
              :placeholder="texts.spellListLevelPlaceholder"
            />
          </UFormField>
        </div>

        <FeatEntityRefRows
          v-model="group.spells"
          kind="SPELL"
        />
      </div>
    </template>

    <!-- Без заклинаний отметка ничего не описывает: расширять нечего -->
    <template #footer>
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
    </template>
  </FeatRowsSection>
</template>
