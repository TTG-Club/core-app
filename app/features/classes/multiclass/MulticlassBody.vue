<script setup lang="ts">
  import { computed } from 'vue';
  import { omit, orderBy, uniqBy } from 'lodash-es';
  import {
    MulticlassStatsBlock,
    MulticlassTable,
    MulticlassProficiency,
  } from './ui';
  import { FeatureCollapse } from '~classes/body/ui';
  import type { MulticlassData } from './types';
  import type { ClassFeature } from '~classes/types';
  import { CasterType } from '~classes/types';

  const props = defineProps<{
    data: MulticlassData;
  }>();

  const totalLevel = computed(() =>
    props.data.classes.reduce((sum, c) => sum + c.level, 0),
  );

  const classNames = computed(() =>
    props.data.classes.map((c) => {
      if (c.subclassUrl && c.detail.parent) {
        return `${c.detail.parent.name.rus} / ${c.detail.name.rus}`;
      }
      return c.detail.name.rus;
    }),
  );

  // Собираем все уникальные умения из всех классов (только те, что есть в таблице)
  const allFeatures = computed(() => {
    const featuresList: Array<ClassFeature> = [];

    // Добавляем умения всех классов (только до максимального уровня каждого класса)
    props.data.classes.forEach((classItem) => {
      classItem.detail.features.forEach((feature) => {
        if (feature.level <= classItem.level) {
          featuresList.push(omit(feature, 'scaling'));

          if (feature.scaling) {
            featuresList.push(
              ...feature.scaling
                .filter((scale) => scale.level <= classItem.level)
                .map((scale) => ({
                  key: feature.key,
                  isSubclass: feature.isSubclass,
                  ...scale,
                })),
            );
          }
        }
      });
    });

    // Убираем дубликаты по key и level, сортируем по уровню
    return orderBy(
      uniqBy(featuresList, (f) => `${f.key}-${f.level}`),
      ['level'],
      ['asc'],
    );
  });

  // Расчет уровня заклинателя по правилам мультиклассирования D&D 5
  const spellcasterLevel = computed(() => {
    let fullCasterLevel = 0;
    let halfCasterLevel = 0;
    let thirdCasterLevel = 0;
    let hasPact = false;

    props.data.classes.forEach((classItem) => {
      if (classItem.detail.casterType === CasterType.FULL) {
        fullCasterLevel += classItem.level;
      } else if (classItem.detail.casterType === CasterType.HALF) {
        halfCasterLevel += classItem.level;
      } else if (classItem.detail.casterType === CasterType.THIRD) {
        thirdCasterLevel += classItem.level;
      } else if (classItem.detail.casterType === CasterType.PACT) {
        hasPact = true;
      }
    });

    // По правилам D&D 5: каждый компонент округляется вниз отдельно, затем суммируется
    const fullContribution = fullCasterLevel;
    const halfContribution = Math.floor(halfCasterLevel / 2);
    const thirdContribution = Math.floor(thirdCasterLevel / 3);

    const calculatedLevel =
      fullContribution + halfContribution + thirdContribution;

    return {
      level: calculatedLevel,
      hasPact,
    };
  });
</script>

<template>
  <div class="@container">
    <div class="flex flex-col gap-6 @min-3xl:flex-row @min-3xl:gap-7">
      <div
        :class="[
          'flex w-full flex-shrink-0 flex-col gap-4',
          '@min-xl:@max-3xl:flex-row @min-3xl:w-80',
        ]"
      >
        <div class="flex w-auto flex-col gap-2">
          <div class="flex w-auto flex-col gap-2">
            <div
              class="flex items-center justify-between rounded-md border border-default px-2.5 py-1.5 leading-tight"
            >
              <span class="text-xs text-secondary">Общий уровень:</span>

              <span>{{ totalLevel }}</span>
            </div>

            <div
              v-if="spellcasterLevel.level > 0 || spellcasterLevel.hasPact"
              class="flex items-center justify-between rounded-md border border-default px-2.5 py-1.5 leading-tight"
            >
              <span class="text-xs text-secondary">Уровень заклинателя:</span>

              <span>
                {{ spellcasterLevel.level }}
                <span v-if="spellcasterLevel.hasPact"> + Пакт</span>
              </span>
            </div>

            <div
              v-for="(classItem, index) in data.classes"
              :key="index"
              class="flex items-center justify-between rounded-md border border-default px-2.5 py-1.5 leading-tight"
            >
              <span class="text-xs text-secondary">{{
                classNames[index]
              }}:</span>

              <span>{{ classItem.level }}</span>
            </div>
          </div>
        </div>

        <MulticlassStatsBlock :data="data" />
      </div>

      <div class="flex min-w-0 flex-auto flex-col gap-6">
        <div class="flex min-w-0 flex-col gap-2">
          <MulticlassTable :data="data" />
        </div>

        <MulticlassProficiency :data="data" />

        <FeatureCollapse
          v-for="feature in allFeatures"
          :key="`${feature.key}-${feature.level}`"
          :feature
        />
      </div>
    </div>
  </div>
</template>
