<script setup lang="ts">
  import { PageGrid } from '~ui/page';

  import { useCharacterSheet } from '../composables';
  import { CharacterSheetCard } from './ui';

  const { character } = useCharacterSheet();

  // Персистентности пока нет — на листе всегда единственный черновой персонаж
  // из общего состояния. Когда появится хранилище, список станет реактивным
  // массивом сохранённых листов.
  const characters = computed(() => [character.value]);
</script>

<template>
  <PageGrid :columns="2">
    <CharacterSheetCard
      v-for="entry in characters"
      :key="entry.id"
      :character="entry"
    />
  </PageGrid>
</template>
