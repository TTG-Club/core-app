<script setup lang="ts">
  import type { ClassInMulticlass } from '~classes/types';
  import { useMulticlassLevelInfo } from '~multiclass/composable';

  interface Props {
    characterLevel: number;
    multiclass: Array<ClassInMulticlass>;
  }

  const props = defineProps<Props>();

  const { containerClasses, cardClasses, cardContentClasses } =
    useMulticlassLevelInfo(props);
</script>

<template>
  <div :class="containerClasses">
    <div :class="cardClasses">
      <div :class="cardContentClasses">
        <span class="text-sm font-medium text-highlighted">
          Общий уровень:
        </span>

        <span class="text-sm">{{ props.characterLevel }}</span>
      </div>
    </div>

    <div
      v-for="(classItem, index) in props.multiclass"
      :key="index"
      :class="cardClasses"
    >
      <div :class="cardContentClasses">
        <span class="text-sm font-medium text-highlighted">
          {{ classItem.class }}
          <span v-if="classItem.subclass"> / {{ classItem.subclass }} </span>:
        </span>

        <span class="text-sm">{{ classItem.level }}</span>
      </div>
    </div>
  </div>
</template>
