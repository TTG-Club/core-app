<script setup lang="ts">
  import type { SourceDetailResponse } from '~sources/types';

  import { SourceBody } from '~sources/body';
  import { getSourceMarkdown } from '~sources/types';
  import { UiDrawer } from '~ui/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `source-${url}`),
    () => $fetch<SourceDetailResponse>(`/api/v2/source/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/sources/${url}`);
  const editUrl = computed(() => `/workshop/sources/${url}`);

  // Геттер, а не готовая строка: сборка Markdown разбирает всю
  // разметку сущности, поэтому откладывается до клика по кнопке.
  const markdown = computed(() => {
    const entity = detail.value;

    return entity ? () => getSourceMarkdown(entity) : undefined;
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
    <SourceBody
      v-if="detail"
      :source="detail"
    />
  </UiDrawer>
</template>
