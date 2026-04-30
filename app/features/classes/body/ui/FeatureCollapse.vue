<script setup lang="ts">
  import type { ClassFeature } from '../../model';

  import { UiCollapse } from '~ui/collapse';
  import { MarkupRender } from '~ui/markup';

  import FeatureOptionsDrawer from './FeatureOptionsDrawer.vue';

  const { feature } = defineProps<{ feature: ClassFeature }>();

  const optionsOpened = ref(false);

  const subtitle = computed(() => {
    const str: Array<string | VNode> = [`${feature.level}-й уровень`];

    if (feature.isSubclass) {
      str.push(', умение подкласса');
    }

    if (feature.additional) {
      str.push(`. `);
      str.push(h(MarkupRender, { renderNode: feature.additional }));
    }

    str.push(`.`);

    return () => str;
  });

  const optionsCount = computed(() => feature.options?.length ?? 0);

  const optionsName = computed(() => feature.optionsName || feature.name);

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
    :id="feature.key"
    default-open
  >
    <template #default>
      <span :class="feature.isSubclass ? 'text-success' : undefined">
        {{ feature.name }}
      </span>
    </template>

    <template #subtitle>
      <component :is="subtitle" />
    </template>

    <template #content>
      <MarkupRender :render-node="feature.description" />

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
          :feature
          :title="optionsName"
        />
      </ClientOnly>
    </template>
  </UiCollapse>
</template>
