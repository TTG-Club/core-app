<script setup lang="ts">
  import { computed } from 'vue';

  import AbilityBonusModeSelect from '~bestiary/editor/ui/type/AbilityBonusModeSelect.vue';

  import type { CreateAbilities, CreateSkill } from '~bestiary/types';

  const props = defineProps<{
    model: Array<CreateSkill>;
    abilities?: CreateAbilities;
    proficiencyBonus: number;
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

  const abilitiesMap: Record<string, keyof CreateAbilities> = {
    STRENGTH: 'str',
    DEXTERITY: 'dex',
    CONSTITUTION: 'con',
    INTELLIGENCE: 'int',
    WISDOM: 'wis',
    CHARISMA: 'chr',
  };

  function getModifier(key: string): string {
    const abilityKey = skillMap[key as SkillKey].ability;
    const ability = abilitiesMap[abilityKey];

    if (!ability) return ''; // если нет подходящего ключа, возвращаем пустую строку

    const base = props.abilities?.[ability]?.value ?? 10;
    const mod = Math.floor((base - 10) / 2);

    const multiplier =
      props.model.find((s) => s.skill === key)?.multiplier ?? 0;

    const bonus = props.proficiencyBonus * multiplier;
    const total = mod + bonus;

    return total >= 0 ? `+${total}` : `${total}`;
  }

  function updateSkill(key: string, multiplier: 0 | 1 | 2) {
    const updated = [...props.model.filter((s) => s.skill !== key)];

    const abilityKey = skillMap[key as SkillKey].ability;
    const ability = abilitiesMap[abilityKey];

    if (!ability) return;

    const base = props.abilities?.[ability]?.value ?? 10;
    const mod = Math.floor((base - 10) / 2);
    const bonus = props.proficiencyBonus * multiplier;
    const total = mod + bonus;
    const text = total >= 0 ? `+${total}` : `${total}`;

    updated.push({
      skill: key,
      multiplier,
      text,
    });

    emit('update:model', updated);
  }
</script>

<template>
  <ARow :gutter="24">
    <span>Бонус Мастерства: {{ props.proficiencyBonus }}</span>
  </ARow>

  <ARow :gutter="24">
    <ACol
      v-for="(keys, ability) in groupedSkills"
      :key="ability"
      :span="4"
    >
      <strong>{{ abilityLabels[ability] ?? ability }}</strong>

      <AFlex
        vertical
        gap="8"
      >
        <AFlex
          v-for="key in keys"
          :key="key"
          align="center"
          gap="8"
        >
          <AbilityBonusModeSelect
            :model-value="
              props.model.find((s) => s.skill === key)?.multiplier ?? 0
            "
            @update:model-value="(val: 0 | 1 | 2) => updateSkill(key, val)"
          />

          <span>
            <strong>{{ skillMap[key].label }}</strong>

            <span>({{ getModifier(key) }})</span>
          </span>
        </AFlex>
      </AFlex>
    </ACol>
  </ARow>
</template>
