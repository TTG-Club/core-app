<script setup lang="ts">
  import type { ClassInMulticlass } from '~classes/types';

  interface Props {
    characterLevel: number;
    multiclass: Array<ClassInMulticlass>;
  }

  const props = defineProps<Props>();
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
          Общий уровень:
        </span>

        <span class="text-sm">{{ props.characterLevel }}</span>
      </div>
    </div>

    <div
      v-for="(classItem, index) in props.multiclass"
      :key="index"
      :class="[
        'w-full overflow-hidden bg-muted',
        'rounded-lg border border-default',
      ]"
    >
      <div
        class="flex w-full flex-row items-center justify-between gap-2 px-4 py-1.5"
      >
        <span class="text-sm font-medium text-highlighted">
          {{ classItem.class }}
          <span v-if="classItem.subclass"> / {{ classItem.subclass }} </span>:
        </span>

        <span class="text-sm">{{ classItem.level }}</span>
      </div>
    </div>
  </div>
</template>
