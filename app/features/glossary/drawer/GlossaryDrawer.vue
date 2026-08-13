<script setup lang="ts">
  import type { GlossaryDetailResponse } from '~glossary/model';

  import { GlossaryBody } from '~glossary/body';
  import { getGlossaryMarkdown } from '~glossary/model';
  import { UiDrawer } from '~ui/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `glossary-${url}`),
    () => $fetch<GlossaryDetailResponse>(`/api/v2/glossary/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/glossary/${url}`);
  const editUrl = computed(() => `/workshop/glossary/${url}`);

  // Геттер, а не готовая строка: сборка Markdown разбирает всю
  // разметку сущности, поэтому откладывается до клика по кнопке.
  const markdown = computed(() => {
    const entity = detail.value;

    return entity ? () => getGlossaryMarkdown(entity) : undefined;
  });
</script>

<template>
  <UiDrawer
    :title="detail?.name"
    :source="detail?.source"
    :date-time="detail?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :markdown
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <GlossaryBody
      v-if="detail"
      :glossary="detail"
    />
  </UiDrawer>
</template>
