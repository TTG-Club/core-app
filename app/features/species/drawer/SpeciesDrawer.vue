<script setup lang="ts">
  import { SpeciesBody } from '~species/body';
  import { UiDrawer } from '~ui/drawer';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `species-${url}`),
    () => $fetch<SpeciesDetailResponse>(`/api/v2/species/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/species/${url}`);
  const editUrl = computed(() => `/workshop/species/${url}`);
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
    <SpeciesBody
      v-if="detail"
      :species="detail"
      hide-gallery
    />
  </UiDrawer>
</template>
