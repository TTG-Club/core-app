<script setup lang="ts">
  import { InfoTooltip } from '~ui/tooltip';
  import type { MulticlassData } from '../types';

  const { data } = defineProps<{
    data: MulticlassData;
  }>();

  const classNames = computed(() =>
    data.classes.map((c) => {
      if (c.subclassUrl && c.detail.parent) {
        return `${c.detail.parent.name.rus} / ${c.detail.name.rus}`;
      }

      return c.detail.name.rus;
    }),
  );

  const primaryCharacteristicsData = computed(() => {
    return data.classes
      .map((classItem, index) => ({
        value: classItem.detail.primaryCharacteristics,
        className: classNames.value[index],
      }))
      .filter((item) => item.value);
  });

  const savingThrowsData = computed(() => {
    return data.classes
      .map((classItem, index) => ({
        value: classItem.detail.savingThrows,
        className: classNames.value[index],
      }))
      .filter((item) => item.value);
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

      <div class="flex flex-col gap-1">
        <template
          v-for="(item, index) in primaryCharacteristicsData"
          :key="index"
        >
          <span>
            {{ item.value }}
            <span class="text-xs text-secondary"> ({{ item.className }})</span>
          </span>
        </template>

        <span v-if="primaryCharacteristicsData.length === 0">Нет</span>
      </div>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
        Спасброски:
      </span>

      <div class="flex flex-col gap-1">
        <template
          v-for="(item, index) in savingThrowsData"
          :key="index"
        >
          <span>
            {{ item.value }}
            <span class="text-xs text-secondary"> ({{ item.className }})</span>
          </span>
        </template>

        <span v-if="savingThrowsData.length === 0">Нет</span>
      </div>
    </div>

    <div class="flex w-full min-w-full flex-col gap-1 px-4 py-1.5">
      <InfoTooltip>
        <span class="min-w-20 flex-none text-sm font-medium text-highlighted">
          Кость Хитов:
        </span>

        <template #content>
          <div class="flex flex-col gap-2">
            <span
              v-for="(classItem, index) in data.classes"
              :key="index"
            >
              <span class="font-medium text-highlighted">
                Хиты на 1 уровне:
              </span>

              {{ classItem.detail.hitDice.maxValue }} + ваш модификатор
              <span class="font-bold text-muted">Телосложения</span>

              <span class="text-xs text-secondary">
                ({{ classNames[index] }})</span
              >
            </span>
          </div>
        </template>
      </InfoTooltip>

      <div class="flex flex-col gap-1">
        <template
          v-for="(classItem, index) in data.classes"
          :key="index"
        >
          <span>
            1{{ classItem.detail.hitDice.label }}
            <span class="text-xs text-secondary">
              ({{ classNames[index] }})</span
            >

            <span v-if="index === data.classes.length - 1">
              за каждый уровень</span
            >
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
