<script setup lang="ts">
  import type { AbilityKey, AbilityRow } from '../../model';

  import SheetAbilityTile from './SheetAbilityTile.vue';

  defineProps<{
    rows: AbilityRow[];
  }>();

  const emit = defineEmits<{
    roll: [abilityKey: AbilityKey];
    settings: [abilityKey: AbilityKey];
    adjust: [abilityKey: AbilityKey, delta: number];
  }>();
</script>

<template>
  <!-- Свой @container: колонки считаем по фактической ширине ряда, а не
    вьюпорта. Так 6 характеристик встают в одну строку, когда места хватает
    (≥576px) — и в узком drawer, и в правой половине широкого режима, — а на
    узких ширинах сворачиваются в 3 колонки. -->
  <div class="@container">
    <div class="grid grid-cols-3 gap-3 pb-2 @xl:grid-cols-6">
      <SheetAbilityTile
        v-for="row in rows"
        :key="row.key"
        :ability-row="row"
        @roll="emit('roll', row.key)"
        @settings="emit('settings', row.key)"
        @adjust="emit('adjust', row.key, $event)"
      />
    </div>
  </div>
</template>
