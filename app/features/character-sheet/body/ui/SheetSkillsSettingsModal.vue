<script setup lang="ts">
  import type { AbilityKey, Character, CharacterSkill } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_OPTIONS,
    CUSTOM_SKILL_NAME_MAX_LENGTH,
    CUSTOM_SKILLS_MAX,
    DEFAULT_CUSTOM_SKILL_ABILITY,
    getDefaultSkillAbility,
    getFormattedBonus,
    getSkillRowGroups,
    getSkillValue,
    hasSkillName,
    isCustomSkill,
    NEW_CUSTOM_BONUS,
    PASSIVE_SKILL_BASE,
    SHEET_SKILL_SETTINGS_LABELS,
    SKILL_GROUP_LABEL_CLASS,
    SKILL_PROFICIENCY_ICONS,
    SKILL_PROFICIENCY_LABELS,
    SKILL_PROFICIENCY_NEXT,
    sortSkillsByName,
    toCustomSkill,
  } from '../../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /** Строка навыка в модалке: черновик навыка и всё, что рисуется рядом с ним. */
  interface SkillSettingsRow {
    /** Запись черновика: её правят поля строки. */
    skill: CharacterSkill;

    /** Значок уровня владения: он же переключает уровень по кругу. */
    proficiencyIcon: string;
    proficiencyLabel: string;
    proficiencyClass: string;

    /** Итог навыка по черновику. */
    formattedValue: string;

    /** Пассивное значение навыка по черновику. */
    passiveValue: number;

    /** Навык заведён игроком: его не возвращают к правилам, а удаляют. */
    isCustom: boolean;

    /** Навык отличается от правил: характеристика подменена или есть бонусы. */
    isChanged: boolean;

    /** Рамка карточки: свой и изменённый навыки подсвечиваются. */
    frameClass: string;
  }

  /** Группа строк модалки: разделитель с характеристикой и её навыки. */
  interface SkillSettingsGroup {
    key: string;

    /** Подпись разделителя; null — группировка выключена, разделителя нет. */
    title: string | null;

    rows: SkillSettingsRow[];
  }

  /** Подпись разделителя группы: в модалке она не подсвечивается. */
  const GROUP_LABEL_CLASS = `${SKILL_GROUP_LABEL_CLASS} text-muted`;

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setSkills } = useCharacterSheet();

  // Черновик правится до «Применить»: копируются и сами навыки, и списки их
  // бонусов — иначе правки уходили бы в лист мимо кнопки.
  const draftSkills = ref<CharacterSkill[]>(
    character.value.skills.map((skill) => ({
      ...skill,
      bonuses: skill.bonuses.map((bonus) => ({ ...bonus })),
    })),
  );

  // Группировка правится тем же черновиком, что и навыки: список в модалке
  // перестраивается сразу, и до «Применить» видно, каким он станет в листе.
  const isGroupedByAbility = ref(character.value.settings.groupSkillsByAbility);

  // Итоги считаются от черновика, а не от листа: числа в модалке меняются
  // сразу, ещё до «Применить».
  const draftCharacter = computed<Character>(() => ({
    ...character.value,
    skills: draftSkills.value,
  }));

  /**
   * Строка навыка со всем, что рисуется рядом с ним.
   *
   * @param skill навык черновика.
   * @returns строка навыка для списка модалки.
   */
  function toDisplayRow(skill: CharacterSkill): SkillSettingsRow {
    const value = getSkillValue(draftCharacter.value, skill);

    const isCustom = isCustomSkill(skill.name);

    // Свой навык «изменённым» не считается: сравнивать его не с чем, к
    // правилам его не возвращают — его удаляют.
    const isChanged =
      !isCustom
      && (skill.ability !== getDefaultSkillAbility(skill.name)
        || skill.bonuses.length > 0);

    return {
      skill,
      proficiencyIcon: SKILL_PROFICIENCY_ICONS[skill.proficiency],
      proficiencyLabel: SKILL_PROFICIENCY_LABELS[skill.proficiency],
      proficiencyClass:
        skill.proficiency === 'none' ? 'text-muted' : 'text-primary',
      formattedValue: getFormattedBonus(value),
      passiveValue: PASSIVE_SKILL_BASE + value,
      isCustom,
      isChanged,
      frameClass:
        isCustom || isChanged ? 'border-primary/40' : 'border-default/50',
    };
  }

  const displayGroups = computed<SkillSettingsGroup[]>(() =>
    getSkillRowGroups(draftSkills.value, isGroupedByAbility.value).map(
      (group) => ({
        key: group.key,
        title: group.title,
        rows: group.rows.map(toDisplayRow),
      }),
    ),
  );

  const customName = ref('');

  const customAbility = ref<AbilityKey>(DEFAULT_CUSTOM_SKILL_ABILITY);

  const customSkillsCount = computed(
    () => draftSkills.value.filter((skill) => isCustomSkill(skill.name)).length,
  );

  const isCustomLimitReached = computed(
    () => customSkillsCount.value >= CUSTOM_SKILLS_MAX,
  );

  const isCustomDuplicate = computed(
    () =>
      customName.value.trim().length > 0
      && hasSkillName(draftSkills.value, customName.value),
  );

  const isCustomAddDisabled = computed(
    () =>
      !customName.value.trim()
      || isCustomDuplicate.value
      || isCustomLimitReached.value,
  );

  /** Подсказка под полем: почему добавить нельзя, иначе — что вообще делает. */
  const customHint = computed(() => {
    if (isCustomDuplicate.value) {
      return SHEET_SKILL_SETTINGS_LABELS.customDuplicate;
    }

    if (isCustomLimitReached.value) {
      return SHEET_SKILL_SETTINGS_LABELS.customLimit;
    }

    return SHEET_SKILL_SETTINGS_LABELS.customHint;
  });

  const customHintClass = computed(() =>
    isCustomDuplicate.value || isCustomLimitReached.value
      ? 'text-warning'
      : 'text-dimmed',
  );

  /** Переключение уровня владения по кругу — как значком в списке навыков. */
  function handleProficiencyCycle(skill: CharacterSkill): void {
    skill.proficiency = SKILL_PROFICIENCY_NEXT[skill.proficiency];
  }

  /** Возврат навыка к правилам: характеристика заготовки и без своих бонусов. */
  function handleSkillReset(skill: CharacterSkill): void {
    const defaultAbility = getDefaultSkillAbility(skill.name);

    if (!defaultAbility) {
      return;
    }

    skill.ability = defaultAbility;
    skill.bonuses = [];
  }

  /** Добавление бонуса навыку: заготовка «+1» правится тут же в строке. */
  function handleBonusAdd(skill: CharacterSkill): void {
    skill.bonuses.push({ id: crypto.randomUUID(), ...NEW_CUSTOM_BONUS });
  }

  /**
   * Добавление своего навыка: он встаёт в общий список по алфавиту, а поле
   * очищается — следующий навык вписывается сразу, без лишнего клика.
   */
  function handleCustomAdd(): void {
    if (isCustomAddDisabled.value) {
      return;
    }

    draftSkills.value = sortSkillsByName([
      ...draftSkills.value,
      toCustomSkill(customName.value, customAbility.value),
    ]);

    customName.value = '';
  }

  /** Удаление своего навыка из черновика. */
  function handleCustomRemove(skill: CharacterSkill): void {
    draftSkills.value = draftSkills.value.filter(
      (draft) => draft.name !== skill.name,
    );
  }

  function handleApply(): void {
    setSkills(draftSkills.value, isGroupedByAbility.value);
    emit('close');
  }

  /** Закрытие без правок: черновик пропадает вместе с окном. */
  function handleCancel(): void {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="SHEET_SKILL_SETTINGS_LABELS.title"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <p class="text-xs text-dimmed">
          {{ SHEET_SKILL_SETTINGS_LABELS.hint }}
        </p>

        <!-- Порядок вывода — такая же настройка списка, как своя строка ниже,
          поэтому и рамка у них общая -->
        <UCheckbox
          v-model="isGroupedByAbility"
          :label="SHEET_SKILL_SETTINGS_LABELS.groupTitle"
          :description="SHEET_SKILL_SETTINGS_LABELS.groupHint"
          class="rounded-lg border border-dashed border-default/70 p-2"
        />

        <!-- Своя строка над списком: с восемнадцатью навыками добавление в
          хвосте пришлось бы искать прокруткой -->
        <div
          class="flex flex-col gap-2 rounded-lg border border-dashed border-default/70 p-2"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SHEET_SKILL_SETTINGS_LABELS.customTitle }}
            </span>

            <div class="flex w-full items-center gap-2 sm:w-auto sm:grow">
              <UInput
                v-model="customName"
                size="sm"
                class="min-w-0 grow"
                :maxlength="CUSTOM_SKILL_NAME_MAX_LENGTH"
                :disabled="isCustomLimitReached"
                :placeholder="SHEET_SKILL_SETTINGS_LABELS.customNamePlaceholder"
                @keydown.enter.prevent="handleCustomAdd"
              />

              <USelect
                v-model="customAbility"
                :items="ABILITY_OPTIONS"
                size="sm"
                class="w-32 shrink-0 sm:w-40"
                :disabled="isCustomLimitReached"
                :aria-label="SHEET_SKILL_SETTINGS_LABELS.abilityPlaceholder"
              />

              <UTooltip :text="SHEET_SKILL_SETTINGS_LABELS.customAdd">
                <UButton
                  icon="tabler:plus"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  square
                  class="shrink-0"
                  :disabled="isCustomAddDisabled"
                  :aria-label="SHEET_SKILL_SETTINGS_LABELS.customAdd"
                  @click.left.exact.prevent="handleCustomAdd"
                />
              </UTooltip>
            </div>
          </div>

          <p
            class="text-xs"
            :class="customHintClass"
          >
            {{ customHint }}
          </p>
        </div>

        <template
          v-for="group in displayGroups"
          :key="group.key"
        >
          <!-- Разделитель группы — как в самом листе; без группировки группа
            одна и подписи у неё нет -->
          <USeparator
            v-if="group.title"
            :label="group.title"
            position="start"
            class="pt-1"
            :ui="{ label: GROUP_LABEL_CLASS }"
          />

          <div
            v-for="row in group.rows"
            :key="row.skill.name"
            class="flex flex-col gap-2 rounded-lg border bg-elevated/20 p-2 transition-colors"
            :class="row.frameClass"
          >
            <div class="flex flex-wrap items-center gap-2">
              <UTooltip
                :text="row.proficiencyLabel"
                :content="{ side: 'top' }"
              >
                <button
                  type="button"
                  class="flex shrink-0 cursor-pointer items-center"
                  :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.proficiency}: ${row.skill.name}`"
                  @click.left.exact.prevent="handleProficiencyCycle(row.skill)"
                >
                  <UIcon
                    :name="row.proficiencyIcon"
                    class="size-4 shrink-0 transition-colors hover:text-primary"
                    :class="row.proficiencyClass"
                  />
                </button>
              </UTooltip>

              <span class="min-w-0 grow truncate text-sm text-toned">
                {{ row.skill.name }}
              </span>

              <span
                v-if="row.isCustom"
                class="shrink-0 rounded border border-primary/40 px-1.5 text-[10px] font-bold tracking-wider text-primary uppercase"
              >
                {{ SHEET_SKILL_SETTINGS_LABELS.customBadge }}
              </span>

              <span
                class="w-8 shrink-0 text-right text-sm font-bold text-highlighted tabular-nums"
              >
                {{ row.formattedValue }}
              </span>

              <UTooltip :text="SHEET_SKILL_SETTINGS_LABELS.passive">
                <span class="w-6 text-right text-xs text-dimmed tabular-nums">
                  {{ row.passiveValue }}
                </span>
              </UTooltip>

              <!-- Отдельная группа: на узкой модалке она переносится под
                название целой строкой, а не рассыпается по краям -->
              <div class="flex w-full items-center gap-2 sm:w-auto">
                <USelect
                  v-model="row.skill.ability"
                  :items="ABILITY_OPTIONS"
                  size="sm"
                  class="min-w-0 grow sm:w-40 sm:grow-0"
                  :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.abilityPlaceholder}: ${row.skill.name}`"
                />

                <!-- У своего навыка на месте возврата к правилам стоит
                  удаление: возвращать его не к чему -->
                <UTooltip
                  v-if="row.isCustom"
                  :text="SHEET_SKILL_SETTINGS_LABELS.customRemove"
                >
                  <UButton
                    icon="tabler:trash"
                    color="error"
                    variant="ghost"
                    size="xs"
                    square
                    :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.customRemove}: ${row.skill.name}`"
                    @click.left.exact.prevent="handleCustomRemove(row.skill)"
                  />
                </UTooltip>

                <UTooltip
                  v-else
                  :text="SHEET_SKILL_SETTINGS_LABELS.resetSkill"
                >
                  <UButton
                    icon="tabler:rotate"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    :disabled="!row.isChanged"
                    :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.resetSkill}: ${row.skill.name}`"
                    @click.left.exact.prevent="handleSkillReset(row.skill)"
                  />
                </UTooltip>

                <UTooltip :text="SHEET_SKILL_SETTINGS_LABELS.addBonus">
                  <UButton
                    icon="tabler:plus"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    square
                    :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.addBonus}: ${row.skill.name}`"
                    @click.left.exact.prevent="handleBonusAdd(row.skill)"
                  />
                </UTooltip>
              </div>
            </div>

            <!-- Строки бонусов — общий компонент настроек листа; у навыка без
              бонусов он не рендерится вовсе, а первый бонус заводит плюс в
              шапке строки: подпись пустого списка и своя кнопка «Добавить» в
              списке из восемнадцати навыков только шумели бы -->
            <SheetCustomBonusRows
              v-if="row.skill.bonuses.length"
              v-model="row.skill.bonuses"
              :character="draftCharacter"
              :with-add="false"
              class="border-l-2 border-primary/40 pl-2"
            />
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
