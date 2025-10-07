<script setup lang="ts">
  import { MarkupRender, MarkupRowRender } from '~ui/markup';
  import { UiCollapse } from '~ui/collapse';
  import type { ClassFeature } from '~classes/types';

  const { feature } = defineProps<{ feature: ClassFeature }>();

  const subtitle = computed(() => {
    const str: Array<string | VNode> = [`${feature.level}-й уровень`];

    if (feature.isSubclass) {
      str.push(', умение подкласса');
    }

    if (feature.additional) {
      str.push(`. `);
      str.push(h(MarkupRowRender, { entry: feature.additional }));
    }

    str.push(`.`);

    return () => str;
  });
</script>

<template>
  <UiCollapse
    :id="feature.key"
    default-open
  >
    <template #default>
      <span :class="feature.isSubclass ? 'text-green-500' : undefined">
        {{ feature.name }}
      </span>
    </template>

    <template #subtitle>
      <component :is="subtitle" />
    </template>

    <template #content>
      <MarkupRender :entries="feature.description" />
    </template>
  </UiCollapse>
</template>
