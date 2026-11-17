<script setup lang="ts">
  import type { SourceDetailResponse } from '~sources/types';

  import { SourceBody } from '~sources/body';
  import { getSourceMarkdown, SOURCES_WORKSHOP_ROUTE } from '~sources/types';
  import { UiDrawer } from '~ui/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { canEditSources } = useUserRoles();

  const { data: detail, status } = useEntityDetail<SourceDetailResponse>(
    () => `/api/v2/source/${url}`,
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/sources/${url}`);

  const editUrl = computed(() =>
    canEditSources.value ? `${SOURCES_WORKSHOP_ROUTE}/${url}` : undefined,
  );

  const markdown = useEntityMarkdown(detail, getSourceMarkdown);
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
