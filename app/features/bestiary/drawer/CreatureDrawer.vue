<script setup lang="ts">
  import type { CreatureDetailResponse } from '~bestiary/model';

  import { CreatureBody } from '~bestiary/body';
  import { getCreatureMarkdown } from '~bestiary/model';
  import { UiDrawer } from '~ui/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `creature-${url}`),
    () => $fetch<CreatureDetailResponse>(`/api/v2/bestiary/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/bestiary/${url}`);
  const editUrl = computed(() => `/workshop/bestiary/${url}`);

  // Геттер, а не готовая строка: сборка Markdown разбирает всю
  // разметку сущности, поэтому откладывается до клика по кнопке.
  const markdown = computed(() => {
    const entity = detail.value;

    return entity ? () => getCreatureMarkdown(entity) : undefined;
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
    <CreatureBody
      v-if="detail"
      :creature="detail"
    />
  </UiDrawer>
</template>
