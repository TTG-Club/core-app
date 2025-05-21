<script setup lang="ts">
  import { computed } from 'vue';

  import type { CreateAbilities, CreateSkill } from '~bestiary/types';

  const props = defineProps<{
    model: Array<CreateSkill>;
    abilities?: CreateAbilities;
  }>();

  const emit = defineEmits<{
    (e: 'update:model', value: Array<CreateSkill>): void;
  }>();

  const skillMap = {
    ACROBATICS: { ability: 'DEXTERITY', label: 'Акробатика' },
    ANIMAL_HANDLING: { ability: 'WISDOM', label: 'Уход за животными' },
    ARCANA: { ability: 'INTELLIGENCE', label: 'Аркана' },
    ATHLETICS: { ability: 'STRENGTH', label: 'Атлетика' },
    DECEPTION: { ability: 'CHARISMA', label: 'Обман' },
    HISTORY: { ability: 'INTELLIGENCE', label: 'История' },
    INSIGHT: { ability: 'WISDOM', label: 'Проницательность' },
    INTIMIDATION: { ability: 'CHARISMA', label: 'Запугивание' },
    INVESTIGATION: { ability: 'INTELLIGENCE', label: 'Анализ' },
    MEDICINE: { ability: 'WISDOM', label: 'Медицина' },
    NATURE: { ability: 'INTELLIGENCE', label: 'Природа' },
    PERCEPTION: { ability: 'WISDOM', label: 'Внимательность' },
    PERFORMANCE: { ability: 'CHARISMA', label: 'Выступление' },
    PERSUASION: { ability: 'CHARISMA', label: 'Убеждение' },
    RELIGION: { ability: 'INTELLIGENCE', label: 'Религия' },
    SLEIGHT_OF_HAND: { ability: 'DEXTERITY', label: 'Ловкость рук' },
    STEALTH: { ability: 'DEXTERITY', label: 'Скрытность' },
    SURVIVAL: { ability: 'WISDOM', label: 'Выживание' },
  } as const;

  type SkillKey = keyof typeof skillMap;

  type GroupedSkills = Record<string, SkillKey[]>;

  const abilityLabels: Record<string, string> = {
    STRENGTH: 'Сила',
    DEXTERITY: 'Ловкость',
    CONSTITUTION: 'Телосложение',
    INTELLIGENCE: 'Интеллект',
    WISDOM: 'Мудрость',
    CHARISMA: 'Харизма',
  };

  const groupedSkills = computed(() => {
    const groups: GroupedSkills = {};

    Object.keys(skillMap).forEach((key) => {
      const skill = skillMap[key as SkillKey];

      (groups[skill.ability] = groups[skill.ability] || []).push(
        key as SkillKey,
      );
    });

    return groups;
  });

  const selected = computed({
    get: () => props.model.map((s) => s.skill),
    set: (value: string[]) => {
      const result: CreateSkill[] = value.map((key) => ({
        skill: key,
        type: skillMap[key as SkillKey].ability,
        text: '',
      }));

      emit('update:model', result);
    },
  });

  const abilitiesMap: Record<string, keyof CreateAbilities> = {
    STRENGTH: 'str',
    DEXTERITY: 'dex',
    CONSTITUTION: 'con',
    INTELLIGENCE: 'int',
    WISDOM: 'wis',
    CHARISMA: 'chr',
  };

  function getModifier(ability: string): string {
    const key = abilitiesMap[ability];

    if (!key) return '';

    const val = props.abilities?.[key]?.value;

    if (typeof val !== 'number') return '';

    const mod = Math.floor((val - 10) / 2);

    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
</script>

<template>
  <ACheckboxGroup v-model:value="selected">
    <ARow :gutter="24">
      <ACol
        v-for="(keys, ability) in groupedSkills"
        :key="ability"
        :span="8"
      >
        <strong>{{ abilityLabels[ability] ?? ability }}</strong>

        <AFlex
          vertical
          gap="8"
        >
          <ACheckbox
            v-for="key in keys"
            :key="key"
            :value="key"
          >
            <strong>{{ skillMap[key].label }}</strong>

            <span>({{ getModifier(skillMap[key].ability) }})</span>
          </ACheckbox>
        </AFlex>
      </ACol>
    </ARow>
  </ACheckboxGroup>
</template>
