<script setup lang="ts">
  import type { ClassInMulticlass } from '../../model';

  interface Props {
    characterLevel: number;
    spellcastingLevel?: number;
    multiclass: Array<ClassInMulticlass>;
  }

  interface GroupedClass {
    className: string;
    totalLevel: number;
  }

  const props = defineProps<Props>();

  /**
   * Группирует классы по имени и берёт максимальный уровень для каждого класса.
   * При повторном выборе одного класса учитывается только наивысший уровень,
   * так как это продолжение того же класса.
   */
  const groupedClasses = computed<Array<GroupedClass>>(() => {
    const groupMap = new Map<string, GroupedClass>();

    for (const classItem of props.multiclass) {
      const existing = groupMap.get(classItem.class);

      if (existing) {
        existing.totalLevel += classItem.level;
      } else {
        groupMap.set(classItem.class, {
          className: classItem.class,
          totalLevel: classItem.level,
        });
      }
    }

    return [...groupMap.values()];
  });

  /**
   * Вычисляет корректный общий уровень персонажа как сумму максимальных уровней
   * по каждому уникальному классу. При повторном выборе одного класса
   * учитывается только наивысший уровень.
   */
  const effectiveCharacterLevel = computed(() => {
    return groupedClasses.value.reduce(
      (sum, group) => sum + group.totalLevel,
      0,
    );
  });
</script>

<template>
  <div class="flex w-full min-w-72 flex-col gap-4">
    <div
      :class="[
        'w-full overflow-hidden bg-muted',
        'rounded-lg border border-default',
      ]"
    >
      <div
        class="flex w-full flex-row items-center justify-between gap-2 px-4 py-1.5"
      >
        <span class="text-sm font-medium text-highlighted">
          Уровень персонажа:
        </span>

        <span class="text-sm">{{ effectiveCharacterLevel }}</span>
      </div>
    </div>

    <div
      v-if="props.spellcastingLevel"
      :class="[
        'w-full overflow-hidden bg-muted',
        'rounded-lg border border-default',
      ]"
    >
      <div
        class="flex w-full flex-row items-center justify-between gap-2 px-4 py-1.5"
      >
        <span class="text-sm font-medium text-highlighted">
          Уровень заклинателя:
        </span>

        <span class="text-sm">{{ props.spellcastingLevel }}</span>
      </div>
    </div>

    <div
      v-for="group in groupedClasses"
      :key="group.className"
      :class="[
        'w-full overflow-hidden bg-muted',
        'rounded-lg border border-default',
      ]"
    >
      <div
        class="flex w-full flex-row items-center justify-between gap-2 px-4 py-1.5"
      >
        <span class="text-sm font-medium text-highlighted">
          {{ group.className }}:
        </span>

        <span class="text-sm">{{ group.totalLevel }}</span>
      </div>
    </div>
  </div>
</template>
