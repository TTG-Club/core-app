<script setup lang="ts">
  import { InfoTooltip } from '~ui/tooltip';
  import type { MulticlassData } from '../types';

  const { data } = defineProps<{
    data: MulticlassData;
  }>();

  const class1Name = computed(() => {
    if (data.class1.subclassUrl && data.class1.detail.parent) {
      return `${data.class1.detail.parent.name.rus} / ${data.class1.detail.name.rus}`;
    }

    return data.class1.detail.name.rus;
  });

  const class2Name = computed(() => {
    if (data.class2.subclassUrl && data.class2.detail.parent) {
      return `${data.class2.detail.parent.name.rus} / ${data.class2.detail.name.rus}`;
    }

    return data.class2.detail.name.rus;
  });
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

      <span>{{ data.class1.detail.primaryCharacteristics }}</span>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Спасброски:
      </span>

      <div class="flex flex-col gap-1">
        <span>
          {{ data.class1.detail.savingThrows }}
          <span class="text-xs text-secondary"> ({{ class1Name }})</span>
        </span>

        <span
          v-if="
            data.class2.detail.savingThrows !== data.class1.detail.savingThrows
          "
        >
          {{ data.class2.detail.savingThrows }}
          <span class="text-xs text-secondary"> ({{ class2Name }})</span>
        </span>
      </div>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <InfoTooltip>
        <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
          Кость Хитов:
        </span>

        <template #content>
          <div class="flex flex-col gap-2">
            <div>
              <span class="font-medium text-highlighted">
                {{ class1Name }}:
              </span>

              <span>
                Хиты на 1 уровне: {{ data.class1.detail.hitDice.maxValue }} +
                ваш модификатор
                <span class="font-bold text-muted">Телосложения</span>
              </span>

              <span>
                1{{ data.class1.detail.hitDice.label }} (или
                {{ data.class1.detail.hitDice.avg }}) + модификатор
                <span class="font-bold text-muted"> Телосложения </span> за
                каждый уровень этого класса, после первого (минимум 1)
              </span>
            </div>

            <div>
              <span class="font-medium text-highlighted">
                {{ class2Name }}:
              </span>

              <span>
                Хиты на 1 уровне: {{ data.class2.detail.hitDice.maxValue }} +
                ваш модификатор
                <span class="font-bold text-muted">Телосложения</span>
              </span>

              <span>
                1{{ data.class2.detail.hitDice.label }} (или
                {{ data.class2.detail.hitDice.avg }}) + модификатор
                <span class="font-bold text-muted"> Телосложения </span> за
                каждый уровень этого класса, после первого (минимум 1)
              </span>
            </div>
          </div>
        </template>
      </InfoTooltip>

      <div class="flex flex-col gap-1">
        <span>
          1{{ data.class1.detail.hitDice.label }} за каждый уровень
          <span class="text-xs text-secondary"> ({{ class1Name }})</span>
        </span>

        <span>
          1{{ data.class2.detail.hitDice.label }} за каждый уровень
          <span class="text-xs text-secondary"> ({{ class2Name }})</span>
        </span>
      </div>
    </div>
  </div>
</template>
