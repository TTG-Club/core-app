<script setup lang="ts">
  import { MarkupRender, MarkupRowRender } from '~ui/markup';
  import { UiCollapse } from '~ui/collapse';
  import type { ClassDetailResponse } from '~classes/types';

  defineProps<{
    equipment: ClassDetailResponse['equipment'];
  }>();

  const altText =
    'В качестве альтернативы базовому снаряжению класса и предыстории, вы' +
    ' можете получить {@bold 2к4 × 10 зм.} и приобрести себе' +
    ' {@link снаряжение|url:/items|target:_blank} самостоятельно.';
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

      <span>
        <MarkupRowRender :entry="altText" />
      </span>
    </template>
  </UiCollapse>
</template>
