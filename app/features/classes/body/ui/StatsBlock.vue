<script setup lang="ts">
  import type { ClassDetailResponse } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  interface StatsBlockProps {
    hitDice?: ClassDetailResponse['hitDice'];
    savingThrows: ClassDetailResponse['savingThrows'];
    primaryCharacteristics: ClassDetailResponse['primaryCharacteristics'];
    requirements: ClassDetailResponse['requirements'];
  }

  const props = defineProps<StatsBlockProps>();
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

      <span>{{ props.primaryCharacteristics }}</span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Спасброски:
      </span>

      <span>
        {{ props.savingThrows }}
      </span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Требования:
      </span>

      <span>{{ props.requirements }}</span>
    </div>

    <div
      v-if="props.hitDice"
      class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5"
    >
      <InfoTooltip>
        <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
          Кость Хитов:
        </span>

        <template #content>
          <div class="flex flex-col gap-2">
            <span>
              <span class="font-medium text-highlighted">
                Хиты на 1 уровне:
              </span>

              {{ props.hitDice.maxValue }} + ваш модификатор

              <span class="font-bold text-muted">Телосложения</span>
            </span>

            <span>
              1{{ props.hitDice.label }} (или {{ props.hitDice.avg }}) +
              модификатор
              <span class="font-bold text-muted"> Телосложения </span> за каждый
              уровень этого класса, после первого (минимум 1)
            </span>
          </div>
        </template>
      </InfoTooltip>

      <span>1{{ props.hitDice.label }} за каждый уровень</span>
    </div>
  </div>
</template>
