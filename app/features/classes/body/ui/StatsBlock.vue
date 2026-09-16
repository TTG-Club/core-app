<script setup lang="ts">
  import type { ClassDetailResponse } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    MULTICLASS_ABILITY_REQUIREMENT,
    MULTICLASS_REQUIREMENT_HINT,
  } from '../../model';

  interface StatsBlockProps {
    hitDice?: ClassDetailResponse['hitDice'];
    savingThrows: ClassDetailResponse['savingThrows'];
    primaryCharacteristics: ClassDetailResponse['primaryCharacteristics'];
  }

  const props = defineProps<StatsBlockProps>();

  /**
   * Требование для мультиклассирования: значение 13 в ключевых характеристиках
   * класса. Сами характеристики приходят с бэкенда готовой строкой с нужным
   * соединителем («Сила или Ловкость», «Ловкость и Мудрость»), поэтому
   * достаточно дописать к ней минимальное значение.
   */
  const multiclassRequirement = computed<string>(() => {
    if (!props.primaryCharacteristics) {
      return '';
    }

    return `${props.primaryCharacteristics} ${MULTICLASS_ABILITY_REQUIREMENT}`;
  });
</script>

<template>
  <div
    :class="[
      '@container w-full min-w-72 overflow-hidden bg-muted py-1.5',
      'rounded-lg border border-default',
    ]"
  >
    <div class="grid h-full grid-cols-1 content-evenly @min-md:grid-cols-2">
      <div class="flex min-w-0 flex-col gap-1 px-4 py-1.5">
        <span class="text-sm font-medium text-highlighted">
          Основная характеристика:
        </span>

        <span>{{ props.primaryCharacteristics }}</span>
      </div>

      <div class="flex min-w-0 flex-col gap-1 px-4 py-1.5">
        <span class="text-sm font-medium text-highlighted">Спасброски:</span>

        <span>
          {{ props.savingThrows }}
        </span>
      </div>

      <div
        v-if="multiclassRequirement"
        class="flex min-w-0 flex-col gap-1 px-4 py-1.5"
      >
        <!-- Подпись длинная и переносится: значок идёт следом за текстом,
          иначе он уезжал к правому краю ячейки и там ужимался -->
        <InfoTooltip
          :text="MULTICLASS_REQUIREMENT_HINT"
          inline
        >
          <span class="text-sm font-medium text-highlighted">
            Требования для мультиклассирования:
          </span>
        </InfoTooltip>

        <span>{{ multiclassRequirement }}</span>
      </div>

      <div
        v-if="props.hitDice"
        class="flex min-w-0 flex-col gap-1 px-4 py-1.5"
      >
        <InfoTooltip inline>
          <span class="text-sm font-medium text-highlighted">
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
                <span class="font-bold text-muted"> Телосложения </span> за
                каждый уровень этого класса, после первого (минимум 1)
              </span>
            </div>
          </template>
        </InfoTooltip>

        <span>1{{ props.hitDice.label }} за каждый уровень</span>
      </div>
    </div>
  </div>
</template>
