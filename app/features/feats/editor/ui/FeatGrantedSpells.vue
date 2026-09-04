<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type {
    FeatEditorLabelOverrides,
    FeatGrantedSpellBlock,
    FeatGrantedSpellGroupRow,
  } from '../../model';

  import { SelectAbilities } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import {
    CLASS_LEVEL_MAX,
    CLASS_LEVEL_MIN,
    createGrantedSpellGroupRow,
    FEAT_GRANTED_SPELL_LEVEL_OPTIONS,
    FEAT_GRANTED_SPELL_SOURCE_OPTIONS,
    getFeatEditorLabels,
    getFeatGrantedSpellLevelValue,
    parseFeatGrantedSpellLevelValue,
  } from '../../model';
  import FeatEntityRefRows from './FeatEntityRefRows.vue';
  import FeatRowsSection from './FeatRowsSection.vue';
  import FeatRowsSeparator from './FeatRowsSeparator.vue';

  /**
   * Заклинания, которые запись даёт знать без выбора, и настройка подготовки.
   *
   * Группами, а не одним списком: заклинания приходят ступенями — у метки дракона
   * первая пачка сразу, следующая на пятом уровне, — и у каждой ступени свой
   * уровень открытия. Группа либо перечисляет заклинания, либо выдаёт весь список
   * класса: перечень устаревает при каждом пополнении справочника, а список
   * собирается при выдаче, и новое заклинание класса достаётся новым персонажам
   * само.
   *
   * Заклинательная характеристика здесь не задаётся: она одна на все заклинания
   * записи — и выданные, и выбранные игроком, — поэтому живёт своим блоком
   * (`FeatSpellcastingAbility`), а не рядом с одним из списков.
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

  const model = defineModel<FeatGrantedSpellBlock>({ required: true });

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

  /**
   * Группа выдаёт весь список класса, а не перечисленные заклинания.
   *
   * @param group группа выдачи.
   * @returns `true` — выдаётся список класса.
   */
  function isClassList(group: FeatGrantedSpellGroupRow): boolean {
    return group.source === 'CLASS_LIST';
  }

  /**
   * Заголовок группы: что выдаётся и с какого уровня. По нему автор находит
   * нужную ступень, не разворачивая её.
   *
   * @param group группа выдачи.
   * @returns подпись шапки группы.
   */
  function getGroupTitle(group: FeatGrantedSpellGroupRow): string {
    const kind = isClassList(group)
      ? texts.value.grantedSpellGroupClassListTitle
      : texts.value.grantedSpellGroupListTitle;

    const level = group.requiredLevel
      ? `${texts.value.grantedSpellGroupFromLevelPrefix} ${group.requiredLevel} ${texts.value.grantedSpellGroupFromLevelSuffix}`
      : texts.value.grantedSpellGroupFromStart;

    return `${kind}${texts.value.grantedSpellGroupTitleSeparator}${level}`;
  }

  /**
   * Значение селекта круга: в записи круг задан двумя полями и отметкой «по
   * ячейкам», а автору показывается одним списком.
   *
   * @param group группа выдачи.
   * @returns значение селекта.
   */
  function getLevelValue(group: FeatGrantedSpellGroupRow): string {
    return getFeatGrantedSpellLevelValue(group.mode, group.level);
  }

  /**
   * Записывает круг группы.
   *
   * @param group группа выдачи.
   * @param value значение селекта.
   */
  function setLevelValue(group: FeatGrantedSpellGroupRow, value: string) {
    const parsed = parseFeatGrantedSpellLevelValue(value);

    group.mode = parsed.mode;
    group.level = parsed.level;
  }

  /**
   * Записывает характеристику группы. Селект отдаёт и массив — берётся первое
   * значение: характеристика у группы одна, выбор из нескольких спрашивают
   * отдельным блоком у заклинаний на выбор.
   *
   * @param group группа выдачи.
   * @param keys выбранная характеристика.
   */
  function setAbility(
    group: FeatGrantedSpellGroupRow,
    keys: AbilityKey | Array<AbilityKey> | undefined,
  ) {
    const [picked] = Array.isArray(keys) ? keys : [keys];

    group.spellcastingAbility = picked;
  }

  /** Заводит группу выдачи. */
  function addGroup() {
    model.value = {
      ...model.value,
      groups: [...model.value.groups, createGrantedSpellGroupRow()],
    };
  }

  /**
   * Убирает группу целиком вместе с её заклинаниями.
   *
   * @param index номер группы.
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
    :summary="texts.grantedSpellsTitle"
    :hint="texts.grantedSpellsHint"
    :empty="texts.grantedSpellsEmpty"
    :count="model.groups.length"
    :add-label="texts.addGrantedSpellGroup"
    @add="addGroup"
  >
    <template
      v-for="(group, index) in model.groups"
      :key="group.uid"
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
            :aria-label="texts.removeGrantedSpellGroup"
            @click.left.exact.prevent="removeGroup(index)"
          />
        </div>

        <div class="grid grid-cols-1 items-end gap-3 md:grid-cols-24">
          <UFormField class="md:col-span-8">
            <template #label>
              <InfoTooltip
                :text="texts.grantedSpellGroupSourceHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ texts.grantedSpellGroupSource }}</span>
              </InfoTooltip>
            </template>

            <USelect
              v-model="group.source"
              :items="FEAT_GRANTED_SPELL_SOURCE_OPTIONS"
              value-key="value"
            />
          </UFormField>

          <!-- Круг — только у списка класса: у перечисленных он свой у каждой
            записи и берётся из справочника -->
          <UFormField class="md:col-span-8">
            <template #label>
              <InfoTooltip
                :text="texts.grantedSpellGroupLevelHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ texts.grantedSpellGroupLevel }}</span>
              </InfoTooltip>
            </template>

            <USelect
              v-if="isClassList(group)"
              :model-value="getLevelValue(group)"
              :items="FEAT_GRANTED_SPELL_LEVEL_OPTIONS"
              value-key="value"
              @update:model-value="setLevelValue(group, $event)"
            />

            <p
              v-else
              class="py-1.5 text-sm text-dimmed italic"
            >
              {{ texts.grantedSpellGroupLevelFromRecord }}
            </p>
          </UFormField>

          <UFormField class="md:col-span-8">
            <template #label>
              <InfoTooltip
                :text="texts.grantedSpellLevelHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ texts.grantedSpellLevel }}</span>
              </InfoTooltip>
            </template>

            <UInputNumber
              v-model="group.requiredLevel"
              :min="CLASS_LEVEL_MIN"
              :max="CLASS_LEVEL_MAX"
              :placeholder="texts.grantedSpellLevelPlaceholder"
              :aria-label="texts.grantedSpellLevel"
            />
          </UFormField>

          <!-- Характеристика у группы, а не у записи: один набор заклинаний
            может считаться от одной характеристики, другой — от другой -->
          <UFormField class="md:col-span-12">
            <template #label>
              <InfoTooltip
                :text="texts.grantedSpellGroupAbilityHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ texts.grantedSpellGroupAbility }}</span>
              </InfoTooltip>
            </template>

            <SelectAbilities
              :model-value="group.spellcastingAbility"
              :placeholder="texts.grantedSpellGroupAbilityPlaceholder"
              @update:model-value="setAbility(group, $event)"
            />
          </UFormField>

          <div class="flex items-center md:col-span-12 md:self-end md:pb-2">
            <InfoTooltip
              :text="texts.alwaysPreparedHint"
              icon="tabler:info-circle-filled"
            >
              <UCheckbox
                v-model="group.alwaysPrepared"
                :label="texts.alwaysPrepared"
              />
            </InfoTooltip>
          </div>
        </div>

        <UFormField v-if="isClassList(group)">
          <template #label>
            <InfoTooltip
              :text="texts.grantedSpellGroupClassesHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ texts.grantedSpellGroupClasses }}</span>
            </InfoTooltip>
          </template>

          <FeatEntityRefRows
            v-model="group.classes"
            kind="CLASS"
          />
        </UFormField>

        <FeatEntityRefRows
          v-else
          v-model="group.spells"
          kind="SPELL"
        />
      </div>
    </template>
  </FeatRowsSection>
</template>
