<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';
  import { UiCollapse } from '~ui/collapse';
  import type { ClassDetailResponse } from '~classes/types';

  defineProps<{
    equipment: ClassDetailResponse['equipment'];
  }>();
</script>

<template>
  <UiCollapse
    v-if="equipment?.length"
    default-open
  >
    <template #default>Снаряжение</template>

    <template #content>
      <span>
        Вы начинаете со следующим снаряжением в дополнение к снаряжению,
        полученному за вашу предысторию:
      </span>

      <MarkupRender :entries="equipment" />
    </template>
  </UiCollapse>
</template>
