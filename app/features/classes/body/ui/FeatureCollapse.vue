<script setup lang="ts">
  import type { ClassFeature, FeatureOptionEntry } from '../../model';

  import { FeatureOptionsDrawer } from '~classes/feature-options-drawer';
  import { UiCollapse } from '~ui/collapse';
  import { MarkupRender } from '~ui/markup';

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

  // Дровер описаний общий со мастером листа персонажа, поэтому берёт плоские
  // записи вариантов, а не ответ API как есть
  const optionEntries = computed<FeatureOptionEntry[]>(() =>
    (props.feature.options ?? []).map((option) => ({
      key: option.key,
      name: option.name.rus || option.name.eng,
      nameEng: option.name.eng,
      description: option.description,
      additional: option.additional ?? '',
      prerequisite: option.prerequisite ?? '',
      requiredClassLevel: option.requiredClassLevel ?? 0,
      repeatable: option.repeatable,
    })),
  );

  const optionsCount = computed(() => optionEntries.value.length);

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
          :options="optionEntries"
          :title="optionsName"
        />
      </ClientOnly>
    </template>
  </UiCollapse>
</template>
