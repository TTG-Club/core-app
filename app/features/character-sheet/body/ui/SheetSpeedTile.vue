<script setup lang="ts">
  import type { CharacterSpeed } from '../../model';

  import { getPrimarySpeed, getSpeedRows } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    speed: CharacterSpeed;
  }>();

  const emit = defineEmits<{
    edit: [];
  }>();

  const primarySpeed = computed(() => getPrimarySpeed(props.speed));

  const speedRows = computed(() => getSpeedRows(props.speed));
</script>

<template>
  <UTooltip :disabled="!speedRows.length">
    <SheetPanel
      :title="primarySpeed.label"
      center-title
      interactive
      class="w-full"
    >
      <button
        type="button"
        class="flex w-full cursor-pointer items-center justify-center pt-1 after:absolute after:inset-0 after:cursor-pointer"
        aria-label="Настроить передвижение"
        @click.left.exact.prevent="emit('edit')"
      >
        <span class="text-2xl leading-none font-bold text-highlighted">
          {{ primarySpeed.value }}

          <span class="text-xs font-normal text-dimmed">
            {{ primarySpeed.unitLabel }}
          </span>
        </span>
      </button>
    </SheetPanel>

    <template #content>
      <div class="flex flex-col gap-1 p-1">
        <div
          v-for="row in speedRows"
          :key="row.key"
          class="flex items-baseline gap-2 text-xs"
        >
          <span class="w-12 shrink-0 font-bold text-highlighted">
            {{ row.formattedValue }}
          </span>

          <span class="text-muted">{{ row.label }}</span>
        </div>
      </div>
    </template>
  </UTooltip>
</template>
