<script setup lang="ts">
  import type { CharacterProficiencies } from '../../model';

  import { SHEET_EMPTY_LABELS } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    proficiencies: CharacterProficiencies;
  }>();

  const groups = computed(() => [
    { key: 'armor', title: 'Снаряжение', items: props.proficiencies.armor },
    { key: 'weapons', title: 'Оружие', items: props.proficiencies.weapons },
    { key: 'tools', title: 'Инструменты', items: props.proficiencies.tools },
  ]);
</script>

<template>
  <SheetPanel>
    <div class="flex flex-col gap-4">
      <div
        v-for="group in groups"
        :key="group.key"
        class="flex flex-col gap-2"
      >
        <h4
          class="border-b border-default/50 pb-1 text-[10px] font-bold tracking-wider text-muted uppercase"
        >
          {{ group.title }}
        </h4>

        <div
          v-if="group.items.length"
          class="flex flex-wrap gap-1.5"
        >
          <span
            v-for="proficiencyName in group.items"
            :key="proficiencyName"
            class="rounded border border-default bg-default/40 px-2.5 py-1 text-[11px] text-toned"
          >
            {{ proficiencyName }}
          </span>
        </div>

        <span
          v-else
          class="text-xs text-dimmed italic"
        >
          {{ SHEET_EMPTY_LABELS.proficiencies }}
        </span>
      </div>
    </div>
  </SheetPanel>
</template>
