<script setup lang="ts">
  import { UiCollapse } from '~ui/collapse';
  import { MarkupRender } from '~ui/markup';

  import type { ClassDetailResponse } from '~classes/types';

  defineProps<{
    equipment: ClassDetailResponse['equipment'];
  }>();
</script>

<template>
  <UiCollapse
    v-if="equipment"
    default-open
  >
    <template #default>Снаряжение</template>

    <template #content>
      <span>
        Вы начинаете со следующим снаряжением в дополнение к снаряжению,
        полученному за вашу предысторию:
      </span>

      <MarkupRender :render-node="equipment" />
    </template>
  </UiCollapse>
</template>
