<script setup lang="ts">
  import type { ClassFeature } from '../../model';

  import { UiCollapse } from '~ui/collapse';
  import { MarkupRender } from '~ui/markup';

  import FeatureOptionsDrawer from './FeatureOptionsDrawer.vue';

  const props = withDefaults(
    defineProps<{
      feature: ClassFeature;
      anchorId?: string;
    }>(),
    {
      anchorId: undefined,
    },
  );

  const optionsOpened = ref(false);

  const subtitle = computed(() => {
    const str: Array<string | VNode> = [`${props.feature.level}-й уровень`];

    if (props.feature.isSubclass) {
      str.push(', умение подкласса');
    }

    if (props.feature.additional) {
      str.push(`. `);
      str.push(h(MarkupRender, { renderNode: props.feature.additional }));
    }

    str.push(`.`);

    return () => str;
  });

  const optionsCount = computed(() => props.feature.options?.length ?? 0);

  const optionsName = computed(
    () => props.feature.optionsName || props.feature.name,
  );

  const optionsLabel = computed(
    () => `${optionsName.value} (${optionsCount.value})`,
  );

  /**
   * Открывает быстрый просмотр вариантов умения.
   */
  function openOptions() {
    optionsOpened.value = true;
  }
</script>

<template>
  <UiCollapse
    :id="props.anchorId ?? props.feature.key"
    default-open
  >
    <template #default>
      <span :class="props.feature.isSubclass ? 'text-success' : undefined">
        {{ props.feature.name }}
      </span>
    </template>

    <template #subtitle>
      <component :is="subtitle" />
    </template>

    <template #content>
      <MarkupRender :render-node="props.feature.description" />

      <div
        v-if="optionsCount"
        class="mt-4 flex"
      >
        <UButton
          icon="tabler:list-search"
          variant="subtle"
          color="neutral"
          :label="optionsLabel"
          @click.left.exact.prevent="openOptions"
        />
      </div>

      <ClientOnly>
        <FeatureOptionsDrawer
          v-if="optionsCount"
          v-model="optionsOpened"
          :feature="props.feature"
          :title="optionsName"
        />
      </ClientOnly>
    </template>
  </UiCollapse>
</template>
