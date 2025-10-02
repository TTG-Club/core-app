<script setup lang="ts">
  import type { ClassDetailResponse } from '~classes/types';

  defineProps<
    Pick<
      ClassDetailResponse,
      'hitDice' | 'savingThrows' | 'proficiency' | 'primaryCharacteristic'
    >
  >();
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-lg border border-default bg-muted py-1.5"
  >
    <div class="flex w-full min-w-full gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Основная хар-ка:
      </span>

      <span>{{ primaryCharacteristic }}</span>
    </div>

    <div class="flex w-full min-w-full gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Спасброски:
      </span>

      <span>
        {{ savingThrows }}
      </span>
    </div>

    <div class="flex w-full min-w-full gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Кость Хитов:
      </span>

      <span>1{{ hitDice.label }} за каждый уровень</span>
    </div>

    <div class="flex w-full min-w-full gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Доспехи:
      </span>

      <span>
        {{ proficiency.armor }}
      </span>
    </div>

    <div class="flex w-full min-w-full gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Оружие:
      </span>

      <span>
        {{ proficiency.weapon }}
      </span>
    </div>
  </div>
</template>
