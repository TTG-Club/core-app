<script setup lang="ts">
  import type { ClassDetailResponse, ClassInMulticlass } from '~classes/types';
  import { InfoTooltip } from '~ui/tooltip';

  interface StatsBlockProps {
    hitDice: ClassDetailResponse['hitDice'];
    savingThrows: ClassDetailResponse['savingThrows'];
    primaryCharacteristics: ClassDetailResponse['primaryCharacteristics'];
    multiclass?: Array<ClassInMulticlass>;
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

    <!-- Для мультикласса показываем кости хитов каждого класса -->
    <div
      v-if="props.multiclass && props.multiclass.length > 0"
      class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5"
    >
      <InfoTooltip>
        <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
          Кость Хитов:
        </span>

        <template #content>
          <div class="flex flex-col gap-2">
            <span
              v-for="(classItem, index) in props.multiclass"
              :key="index"
            >
              {{ classItem.hitDice || '—' }}
              <span
                v-if="classItem.subclass"
                class="text-xs text-secondary"
              >
                ({{ classItem.class }} / {{ classItem.subclass }})
              </span>

              <span
                v-else
                class="text-xs text-secondary"
              >
                ({{ classItem.class }})
              </span>
            </span>
          </div>
        </template>
      </InfoTooltip>

      <div class="flex flex-col gap-1">
        <span
          v-for="(classItem, index) in props.multiclass"
          :key="index"
        >
          {{ classItem.hitDice || '—' }}
          <span
            v-if="classItem.subclass"
            class="text-xs text-secondary"
          >
            ({{ classItem.class }} / {{ classItem.subclass }})
          </span>

          <span
            v-else
            class="text-xs text-secondary"
          >
            ({{ classItem.class }})
          </span>
        </span>
      </div>
    </div>

    <!-- Для обычного класса показываем стандартную информацию -->
    <div
      v-else
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

              {{ hitDice.maxValue }} + ваш модификатор

              <span class="font-bold text-muted">Телосложения</span>
            </span>

            <span>
              1{{ hitDice.label }} (или {{ hitDice.avg }}) + модификатор
              <span class="font-bold text-muted"> Телосложения </span> за каждый
              уровень этого класса, после первого (минимум 1)
            </span>
          </div>
        </template>
      </InfoTooltip>

      <span>1{{ hitDice.label }} за каждый уровень</span>
    </div>
  </div>
</template>
