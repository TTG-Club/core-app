<script setup lang="ts">
  import type { ClassDetailResponse } from '~classes/types';

  defineProps<
    Pick<
      ClassDetailResponse,
      'hitDice' | 'savingThrows' | 'proficiency' | 'primaryCharacteristics'
    >
  >();
</script>

<template>
  <div
    :class="[
      'w-full min-w-72 overflow-hidden bg-muted py-1.5',
      'rounded-lg border border-default',
    ]"
  >
    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Основная характеристика:
      </span>

      <span>{{ primaryCharacteristics }}</span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Спасброски:
      </span>

      <span>
        {{ savingThrows }}
      </span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Кость Хитов:
      </span>

      <span>1{{ hitDice.label }} за каждый уровень</span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Хиты на 1 уровне:
      </span>

      <span>
        {{ hitDice.maxValue }} + ваш модификатор

        <span class="font-bold text-muted">Телосложения</span>
      </span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Хиты на следующих уровнях:
      </span>

      <span>
        1{{ hitDice.label }} (или {{ hitDice.avg }}) + модификатор
        <span class="font-bold text-muted"> Телосложения </span> за каждый
        уровень этого класса, после первого (минимум 1)
      </span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Владение доспехами:
      </span>

      <span>
        {{ proficiency.armor }}
      </span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Владение оружием:
      </span>

      <span>
        {{ proficiency.weapon }}
      </span>
    </div>
  </div>
</template>
