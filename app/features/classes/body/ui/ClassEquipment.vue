<script setup lang="ts">
  import type { ClassDetailResponse } from '~classes/model';

  import { MarkupContent } from '~markup/content';
  import { UiCollapse } from '~ui/collapse';

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

      <MarkupContent :content="equipment" />
    </template>
  </UiCollapse>
</template>
