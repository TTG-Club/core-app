<script setup lang="ts">
  import type { ClassDetailResponse, ClassInMulticlass } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  interface MulticlassStatsBlockProps {
    savingThrows: ClassDetailResponse['savingThrows'];
    primaryCharacteristics: ClassDetailResponse['primaryCharacteristics'];
    requirements: ClassDetailResponse['requirements'];
    multiclass?: Array<ClassInMulticlass>;
  }

  interface GroupedHitDice {
    hitDice: string;
    totalLevel: number;
    /** Уникальные названия классов, объединённые в эту группу. */
    uniqueClassNames: Array<string>;
    /** Отдельные вхождения для тултипа. */
    entries: Array<ClassInMulticlass>;
  }

  const props = defineProps<MulticlassStatsBlockProps>();

  /**
   * Группирует кости хитов мультикласса по значению кости.
   */
  const groupedHitDice = computed<Array<GroupedHitDice>>(() => {
    if (!props.multiclass || props.multiclass.length === 0) {
      return [];
    }

    const groupMap = new Map<string, GroupedHitDice>();

    for (const classItem of props.multiclass) {
      const hitDice = classItem.hitDice ?? '—';
      const existingGroup = groupMap.get(hitDice);

      if (existingGroup) {
        existingGroup.totalLevel += classItem.level;

        if (!existingGroup.uniqueClassNames.includes(classItem.class)) {
          existingGroup.uniqueClassNames.push(classItem.class);
        }

        existingGroup.entries.push(classItem);
      } else {
        groupMap.set(hitDice, {
          hitDice,
          totalLevel: classItem.level,
          uniqueClassNames: [classItem.class],
          entries: [classItem],
        });
      }
    }

    return [...groupMap.values()];
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
              v-for="(classItem, classIndex) in props.multiclass"
              :key="classIndex"
            >
              {{ classItem.hitDice || '—' }}
              <span
                v-if="classItem.subclass"
                class="text-xs text-secondary"
              >
                ({{ classItem.class }} / {{ classItem.subclass }},
                {{ classItem.level }} ур.)
              </span>

              <span
                v-else
                class="text-xs text-secondary"
              >
                ({{ classItem.class }}, {{ classItem.level }} ур.)
              </span>
            </span>
          </div>
        </template>
      </InfoTooltip>

      <div class="flex flex-col gap-1">
        <span
          v-for="group in groupedHitDice"
          :key="group.hitDice"
        >
          {{ group.hitDice }}
          <span class="text-xs text-secondary">
            ({{ group.uniqueClassNames.join(', ') }})
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
