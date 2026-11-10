<script setup lang="ts">
  import type { ClassDetailResponse } from '../../model';

  import { UiCollapse } from '~ui/collapse';
  import { MarkupRender } from '~ui/markup';

  defineProps<{
    equipment: ClassDetailResponse['equipment'];
  }>();
</script>

<template>
  <UiCollapse default-open>
    <template #default>Снаряжение</template>

    <template #content>
      <span>
        Вы начинаете со следующим снаряжением в дополнение к снаряжению,
        полученному за вашу предысторию:
      </span>

      <!-- Строка вариантов рисуется без обёртки: без div она встала бы в одну
        строку с вводной фразой -->
      <div>
        <MarkupRender :render-node="equipment" />
      </div>
    </template>
  </UiCollapse>
</template>
