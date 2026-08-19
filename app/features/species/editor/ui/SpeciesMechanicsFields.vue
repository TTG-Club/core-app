<script setup lang="ts">
  import type { SpeciesMechanics } from '~species/model';

  import { createMechanicChoice } from '~/shared/types';
  import { SPECIES_MECHANICS_EDITOR } from '~species/model';
  import { SelectDamageType, SelectSkills } from '~ui/select';

  import { createSpeciesMechanics } from '../../model';

  /**
   * Механика влияния на лист персонажа: то, что лист применяет сам. Один и тот
   * же блок стоит и у самой записи вида, и у каждого её умения — модель у них
   * общая.
   *
   * Форма покрывает то, чем виды справочника пользуются на деле: защиты от
   * урона, владения навыками и выбор навыка. Скорости, хиты, класс доспеха и
   * телепатия у видов встречаются поштучно и пока остаются в тексте описания —
   * поля для них появятся, когда появится, что ими заполнять.
   */
  const model = defineModel<SpeciesMechanics | undefined>();

  /**
   * Механика с заполненными блоками: селекторам нужно, куда писать, а у записи
   * без механики её ещё нет.
   *
   * @returns текущая механика либо пустая заготовка.
   */
  function withMechanics(): SpeciesMechanics {
    return model.value ?? createSpeciesMechanics();
  }

  const resistances = computed<Array<string>>({
    get: () => model.value?.modifiers.damage.resistances ?? [],
    set: (value) => setDamage('resistances', value),
  });

  const immunities = computed<Array<string>>({
    get: () => model.value?.modifiers.damage.immunities ?? [],
    set: (value) => setDamage('immunities', value),
  });

  const vulnerabilities = computed<Array<string>>({
    get: () => model.value?.modifiers.damage.vulnerabilities ?? [],
    set: (value) => setDamage('vulnerabilities', value),
  });

  const grantedSkills = computed<Array<string>>({
    get: () => model.value?.proficiencies.skills ?? [],
    set: (value) => {
      const mechanics = withMechanics();

      model.value = {
        ...mechanics,
        proficiencies: { ...mechanics.proficiencies, skills: value },
      };
    },
  });

  const skillChoice = computed(() =>
    model.value?.choices.find((choice) => choice.type === 'SKILL'),
  );

  /** Пул выбора, как он сейчас записан в механике. */
  const currentChoiceOptions = computed<Array<string>>(() =>
    (skillChoice.value?.options ?? []).map((option) => option.value),
  );

  const skillChoiceCount = computed<number>({
    get: () => skillChoice.value?.count ?? 0,
    set: (value) => setSkillChoice(value, currentChoiceOptions.value),
  });

  // Пул без количества выбора не существует: селектор пула выключен, пока
  // количество нулевое, поэтому сеттер всегда получает ненулевое количество.
  const skillChoiceOptions = computed<Array<string>>({
    get: () => currentChoiceOptions.value,
    set: (value) => setSkillChoice(skillChoice.value?.count ?? 0, value),
  });

  /**
   * Записывает один из наборов защит от урона, не трогая остальные.
   *
   * @param key какой набор защит меняется.
   * @param value типы урона из справочника.
   */
  function setDamage(
    key: 'resistances' | 'immunities' | 'vulnerabilities',
    value: Array<string>,
  ): void {
    const mechanics = withMechanics();

    model.value = {
      ...mechanics,
      modifiers: {
        ...mechanics.modifiers,
        damage: { ...mechanics.modifiers.damage, [key]: value },
      },
    };
  }

  /**
   * Пересборка выбора навыка. Количество 0 убирает выбор целиком: запись,
   * которая ничего не спрашивает, не должна оставлять в механике пустой выбор.
   *
   * @param count сколько навыков выбирает игрок.
   * @param options пул навыков; пусто — выбор из всех.
   */
  function setSkillChoice(count: number, options: Array<string>): void {
    const mechanics = withMechanics();

    const others = mechanics.choices.filter(
      (choice) => choice.type !== 'SKILL',
    );

    if (!count) {
      model.value = { ...mechanics, choices: others };

      return;
    }

    model.value = {
      ...mechanics,
      choices: [
        ...others,
        {
          ...createMechanicChoice(),
          key: SPECIES_MECHANICS_EDITOR.skillChoiceKey,
          type: 'SKILL',
          label: SPECIES_MECHANICS_EDITOR.skillChoiceLabel,
          count,
          options: options.map((value) => ({ value })),
        },
      ],
    };
  }
</script>

<template>
  <UFormField
    class="col-span-full md:col-span-8"
    :label="SPECIES_MECHANICS_EDITOR.resistanceLabel"
    name="mechanics.modifiers.damage.resistances"
  >
    <SelectDamageType
      v-model="resistances"
      multiple
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-8"
    :label="SPECIES_MECHANICS_EDITOR.immunityLabel"
    name="mechanics.modifiers.damage.immunities"
  >
    <SelectDamageType
      v-model="immunities"
      multiple
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-8"
    :label="SPECIES_MECHANICS_EDITOR.vulnerabilityLabel"
    name="mechanics.modifiers.damage.vulnerabilities"
  >
    <SelectDamageType
      v-model="vulnerabilities"
      multiple
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-8"
    :label="SPECIES_MECHANICS_EDITOR.skillsLabel"
    :help="SPECIES_MECHANICS_EDITOR.skillsHelp"
    name="mechanics.proficiencies.skills"
  >
    <SelectSkills
      v-model="grantedSkills"
      multiple
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-4"
    :label="SPECIES_MECHANICS_EDITOR.skillChoiceCountLabel"
    :help="SPECIES_MECHANICS_EDITOR.skillChoiceCountHelp"
    name="mechanics.choices.count"
  >
    <UInputNumber
      v-model="skillChoiceCount"
      :min="0"
      :max="SPECIES_MECHANICS_EDITOR.skillChoiceMaximum"
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-12"
    :label="SPECIES_MECHANICS_EDITOR.skillChoiceOptionsLabel"
    :help="SPECIES_MECHANICS_EDITOR.skillChoiceOptionsHelp"
    name="mechanics.choices.options"
  >
    <SelectSkills
      v-model="skillChoiceOptions"
      :disabled="!skillChoiceCount"
      multiple
    />
  </UFormField>
</template>
