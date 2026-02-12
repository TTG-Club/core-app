<script setup lang="ts">
  import CharacterSheet from '~/features/character-sheet/components/CharacterSheet.vue';

  import type { Character } from '~/features/character-sheet/types';

  const character = ref<Character>({
    id: '1',
    name: 'Келдрик Рунодержатель',
    race: 'Дварф',
    class: 'Воин',
    level: 1,
    xp: { current: 100, max: 300 },
    stats: {
      str: 16,
      dex: 13,
      con: 17,
      int: 12,
      wis: 12,
      cha: 11,
    },
    savingThrows: {
      str: { proficient: true, value: 5 },
      dex: { proficient: false, value: 1 },
      con: { proficient: true, value: 5 },
      int: { proficient: false, value: 1 },
      wis: { proficient: false, value: 1 },
      cha: { proficient: false, value: 0 },
    },
    skills: [
      { name: 'Акробатика', modifier: 'dex', proficient: false, value: 1 },
      {
        name: 'Уход за животными',
        modifier: 'wis',
        proficient: true,
        value: 3,
      },
      { name: 'Аркана', modifier: 'int', proficient: false, value: 1 },
      { name: 'Атлетика', modifier: 'str', proficient: true, value: 5 },
      { name: 'Обман', modifier: 'cha', proficient: false, value: 0 },
      { name: 'История', modifier: 'int', proficient: false, value: 1 },
      {
        name: 'Проницательность',
        modifier: 'wis',
        proficient: false,
        value: 1,
      },
      { name: 'Запугивание', modifier: 'cha', proficient: false, value: 0 },
      { name: 'Анализ', modifier: 'int', proficient: false, value: 1 },
      { name: 'Медицина', modifier: 'wis', proficient: false, value: 1 },
      { name: 'Природа', modifier: 'int', proficient: false, value: 1 },
      { name: 'Внимательность', modifier: 'wis', proficient: true, value: 3 },
      { name: 'Выступление', modifier: 'cha', proficient: false, value: 0 },
      { name: 'Убеждение', modifier: 'cha', proficient: false, value: 0 },
      { name: 'Религия', modifier: 'int', proficient: false, value: 1 },
      { name: 'Ловкость рук', modifier: 'dex', proficient: false, value: 1 },
      { name: 'Скрытность', modifier: 'dex', proficient: false, value: 1 },
      { name: 'Выживание', modifier: 'wis', proficient: true, value: 3 },
    ],
    params: {
      speed: 30,
      initiative: 1,
      proficiencyBonus: 2,
      armorClass: 12,
      hp: { current: 12, max: 15, temp: 0 },
    },
    passiveSenses: {
      perception: 13,
      insight: 11,
      investigation: 11,
    },
    proficiencies: {
      armor: ['Тяжелая броня', 'Средняя броня', 'Легкая броня', 'Щиты'],
      weapons: ['Боевые топоры', 'Молоты', 'Простое оружие'],
      tools: ['Набор кузнеца', 'Набор пивовара'],
      languages: ['Общий', 'Дварфийский', 'Гномский'],
    },
  });
</script>

<template>
  <NuxtLayout>
    <CharacterSheet :character="character" />
  </NuxtLayout>
</template>
