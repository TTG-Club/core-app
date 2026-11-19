<script setup lang="ts">
  import { useConditionDescriptions } from '~initiative/composables';
  import { CONDITION_LABELS } from '~initiative/model';
  import { MarkupRender } from '~ui/markup';

  const { glossaryUrl } = defineProps<{
    /** Адрес статьи глоссария с правилами состояния. */
    glossaryUrl: string;
  }>();

  const { descriptions, statuses, load } = useConditionDescriptions();

  const description = computed(() => descriptions.value[glossaryUrl]);

  const isError = computed(() => statuses.value[glossaryUrl] === 'error');

  // Грузим, только когда описание показали: в окне два десятка состояний, а
  // читают из них одно-два. Повторный показ берёт статью из общего кэша.
  watch(
    () => glossaryUrl,
    (url) => {
      void load(url);
    },
    { immediate: true },
  );
</script>

<template>
  <div class="text-sm text-default">
    <MarkupRender
      v-if="description"
      :render-node="description"
    />

    <span
      v-else-if="isError"
      class="text-xs text-error"
    >
      {{ CONDITION_LABELS.descriptionError }}
    </span>

    <div
      v-else
      class="flex flex-col gap-1.5"
    >
      <USkeleton class="h-3 w-full" />

      <USkeleton class="h-3 w-2/3" />
    </div>
  </div>
</template>
