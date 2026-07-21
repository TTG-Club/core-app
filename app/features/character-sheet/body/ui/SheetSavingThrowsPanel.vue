<script setup lang="ts">
  import type { AbilityKey, SavingThrowRow } from '../../model';

  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    rows: SavingThrowRow[];
  }>();

  const emit = defineEmits<{
    roll: [row: SavingThrowRow];
    toggle: [abilityKey: AbilityKey];
  }>();

  const displayRows = computed(() =>
    props.rows.map((row) => ({
      ...row,
      icon: row.proficient ? 'tabler:circle-filled' : 'tabler:circle',
      iconClass: row.proficient ? 'text-warning' : 'text-muted',
    })),
  );
</script>

<template>
  <SheetPanel title="Спасброски">
    <div class="grid grid-flow-col grid-cols-2 grid-rows-3 gap-2">
      <div
        v-for="row in displayRows"
        :key="row.key"
        class="relative flex items-center gap-2 rounded border border-transparent bg-default/30 px-2 py-1.5 transition-colors hover:border-warning/60 hover:bg-accented/40"
      >
        <button
          type="button"
          class="z-10 flex cursor-pointer items-center"
          :aria-label="`Владение спасброском: ${row.label}`"
          @click.left.exact.prevent="emit('toggle', row.key)"
        >
          <UIcon
            :name="row.icon"
            class="size-3 shrink-0 transition-colors hover:text-warning"
            :class="row.iconClass"
          />
        </button>

        <button
          type="button"
          class="flex min-w-0 grow cursor-pointer items-center after:absolute after:inset-0 after:cursor-pointer"
          :aria-label="`Спасбросок: ${row.label}`"
          @click.left.exact.prevent="emit('roll', row)"
        >
          <span class="text-xs text-toned">{{ row.label }}</span>

          <span
            class="ml-auto rounded border border-default/50 bg-default/60 px-1.5 text-sm font-bold text-highlighted"
          >
            {{ row.formattedValue }}
          </span>
        </button>
      </div>
    </div>
  </SheetPanel>
</template>
