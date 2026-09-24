<script setup lang="ts">
  import type {
    BastionFacilityCreate,
    BastionFacilityDetailResponse,
  } from '../model';

  import { UiDrawer } from '~ui/drawer';

  import { BastionFacilityBody } from '../body';
  import { BASTION_API_PATH, getBastionFacilityMarkdown } from '../model';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: BastionFacilityCreate;
  }>();

  const {
    data: facility,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<BastionFacilityDetailResponse>(`${BASTION_API_PATH}/preview`, {
        method: 'post',
        body: state,
      }),
    {
      lazy: true,
      server: false,
      immediate: false,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');

  const markdown = useEntityMarkdown(facility, getBastionFacilityMarkdown);

  whenever(opened, () => {
    clear();
    loadPreview();
  });
</script>

<template>
  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="facility?.name"
    :source="facility?.source"
    :is-loading
    :is-error
    :markdown
    width="100%"
    @close="opened = false"
  >
    <BastionFacilityBody
      v-if="facility"
      :facility
    />
  </UiDrawer>
</template>
