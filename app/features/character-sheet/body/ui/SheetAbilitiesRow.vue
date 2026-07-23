<script setup lang="ts">
  import type { AbilityKey, AbilityRow } from '../../model';

  import SheetAbilityTile from './SheetAbilityTile.vue';

  defineProps<{
    rows: AbilityRow[];
  }>();

  const emit = defineEmits<{
    roll: [abilityKey: AbilityKey];
    settings: [abilityKey: AbilityKey];
  }>();
</script>

<template>
  <div
    class="grid grid-cols-3 gap-3 pb-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6"
  >
    <SheetAbilityTile
      v-for="row in rows"
      :key="row.key"
      :ability-row="row"
      @roll="emit('roll', row.key)"
      @settings="emit('settings', row.key)"
    />
  </div>
</template>
