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

  const totalLevel = computed(
    () => props.data.class1.level + props.data.class2.level,
  );

  const class1Name = computed(() => {
    if (props.data.class1.subclassUrl && props.data.class1.detail.parent) {
      return `${props.data.class1.detail.parent.name.rus} / ${props.data.class1.detail.name.rus}`;
    }

    return props.data.class1.detail.name.rus;
  });

  const class2Name = computed(() => {
    if (props.data.class2.subclassUrl && props.data.class2.detail.parent) {
      return `${props.data.class2.detail.parent.name.rus} / ${props.data.class2.detail.name.rus}`;
    }

    return props.data.class2.detail.name.rus;
  });

  // Собираем все уникальные умения из всех классов (только те, что есть в таблице)
  const allFeatures = computed(() => {
    const featuresList: Array<ClassFeature> = [];

    // Добавляем умения класса 1 (только до максимального уровня класса)
    props.data.class1.detail.features.forEach((feature) => {
      if (feature.level <= props.data.class1.level) {
        featuresList.push(omit(feature, 'scaling'));

        if (feature.scaling) {
          featuresList.push(
            ...feature.scaling
              .filter((scale) => scale.level <= props.data.class1.level)
              .map((scale) => ({
                key: feature.key,
                isSubclass: feature.isSubclass,
                ...scale,
              })),
          );
        }
      }
    });

    // Добавляем умения класса 2 (только до максимального уровня класса)
    props.data.class2.detail.features.forEach((feature) => {
      if (feature.level <= props.data.class2.level) {
        featuresList.push(omit(feature, 'scaling'));

        if (feature.scaling) {
          featuresList.push(
            ...feature.scaling
              .filter((scale) => scale.level <= props.data.class2.level)
              .map((scale) => ({
                key: feature.key,
                isSubclass: feature.isSubclass,
                ...scale,
              })),
          );
        }
      }
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

    // Класс 1
    if (props.data.class1.detail.casterType === CasterType.FULL) {
      fullCasterLevel += props.data.class1.level;
    } else if (props.data.class1.detail.casterType === CasterType.HALF) {
      halfCasterLevel += props.data.class1.level;
    } else if (props.data.class1.detail.casterType === CasterType.THIRD) {
      thirdCasterLevel += props.data.class1.level;
    } else if (props.data.class1.detail.casterType === CasterType.PACT) {
      hasPact = true;
    }

    // Класс 2
    if (props.data.class2.detail.casterType === CasterType.FULL) {
      fullCasterLevel += props.data.class2.level;
    } else if (props.data.class2.detail.casterType === CasterType.HALF) {
      halfCasterLevel += props.data.class2.level;
    } else if (props.data.class2.detail.casterType === CasterType.THIRD) {
      thirdCasterLevel += props.data.class2.level;
    } else if (props.data.class2.detail.casterType === CasterType.PACT) {
      hasPact = true;
    }

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
              class="flex items-center justify-between rounded-md border border-default px-2.5 py-1.5 leading-tight"
            >
              <span class="text-xs text-secondary">{{ class1Name }}:</span>

              <span>{{ data.class1.level }}</span>
            </div>

            <div
              class="flex items-center justify-between rounded-md border border-default px-2.5 py-1.5 leading-tight"
            >
              <span class="text-xs text-secondary">{{ class2Name }}:</span>

              <span>{{ data.class2.level }}</span>
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
