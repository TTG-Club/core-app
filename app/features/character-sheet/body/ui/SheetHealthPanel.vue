<script setup lang="ts">
  import type {
    CharacterExtraHitDie,
    CharacterHealth,
    CharacterHitDie,
  } from '../../model';

  import { getHitDiceTotals } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    health: CharacterHealth;
    hitDice: CharacterHitDie[];
    extraHitDice: CharacterExtraHitDie[];
  }>();

  const emit = defineEmits<{
    edit: [];
  }>();

  const hitDiceTotals = computed(() =>
    getHitDiceTotals(props.hitDice, props.extraHitDice),
  );
</script>

<template>
  <SheetPanel
    title="Здоровье"
    interactive
  >
    <button
      type="button"
      class="w-full cursor-pointer pt-1 text-left after:absolute after:inset-0 after:cursor-pointer"
      aria-label="Настроить очки здоровья и кости хитов"
      @click.left.exact.prevent="emit('edit')"
    >
      <span class="grid grid-cols-3 items-end gap-2 text-center">
        <span class="flex flex-col items-start">
          <span class="text-[10px] text-muted uppercase">Сейчас</span>

          <span class="mt-1 text-2xl leading-none font-bold text-highlighted">
            {{ health.current }}
          </span>
        </span>

        <span class="flex flex-col items-center">
          <span class="text-[10px] text-muted uppercase">Всего</span>

          <span class="mt-1 text-lg leading-none font-medium text-muted">
            / {{ health.max }}
          </span>
        </span>

        <span class="flex flex-col items-end">
          <span class="text-[10px] text-muted uppercase">Врем.</span>

          <span class="mt-1 text-xl leading-none font-bold text-warning">
            {{ health.temporary }}
          </span>
        </span>
      </span>

      <span
        class="mt-3 flex items-center justify-between border-t border-default/50 pt-3"
      >
        <span class="text-[10px] font-bold text-muted uppercase">
          Кости хитов
        </span>

        <span class="text-sm font-bold text-highlighted">
          {{ hitDiceTotals.current }} / {{ hitDiceTotals.max }}
        </span>
      </span>
    </button>
  </SheetPanel>
</template>
