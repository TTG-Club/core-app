<script setup lang="ts">
  import { ItemBody } from '~/features/items/body';
  import { UiDrawer } from '~ui/drawer';

  import type { ItemDetailResponse } from '~/features/items/types';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `item-${url}`),
    () => $fetch<ItemDetailResponse>(`/api/v2/item/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/item/${url}`);
  const editUrl = computed(() => `/workshop/item/${url}`);
</script>

<template>
  <UiDrawer
    :title="detail?.name"
    :source="detail?.source"
    :date-time="detail?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <ItemBody
      v-if="detail"
      :item="detail"
    />
  </UiDrawer>
</template>
