<script setup lang="ts">
  import type { FeatDetailResponse } from '~feats/model';

  import { FeatBody } from '~feats/body';
  import { getFeatMarkdown } from '~feats/model';
  import { UiDrawer } from '~ui/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `feat-${url}`),
    () => $fetch<FeatDetailResponse>(`/api/v2/feats/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/feats/${url}`);
  const editUrl = computed(() => `/workshop/feats/${url}`);

  const markdown = computed(() =>
    detail.value ? getFeatMarkdown(detail.value) : '',
  );
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
    <FeatBody
      v-if="detail"
      :feat="detail"
    />
  </UiDrawer>
</template>
