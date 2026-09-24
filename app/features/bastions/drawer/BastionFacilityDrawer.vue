<script setup lang="ts">
  import type { BastionFacilityDetailResponse } from '../model';

  import { UiDrawer } from '~ui/drawer';

  import { BastionFacilityBody } from '../body';
  import {
    BASTION_API_PATH,
    BASTION_SECTION,
    BASTION_WORKSHOP_PATH,
    getBastionFacilityMarkdown,
  } from '../model';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `bastion-${url}`),
    () => $fetch<BastionFacilityDetailResponse>(`${BASTION_API_PATH}/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/${BASTION_SECTION}/${url}`);
  const editUrl = computed(() => `${BASTION_WORKSHOP_PATH}/${url}`);

  const markdown = useEntityMarkdown(detail, getBastionFacilityMarkdown);
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
    <BastionFacilityBody
      v-if="detail"
      :facility="detail"
    />
  </UiDrawer>
</template>
