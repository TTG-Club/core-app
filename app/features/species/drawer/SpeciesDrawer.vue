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
    <div
      v-if="detail"
      class="mb-4 overflow-hidden rounded-lg border border-default bg-muted py-1.5"
    >
      <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
        <span class="min-w-20 text-sm font-medium text-highlighted">Тип:</span>

        <span>{{ detail.properties.type }}</span>
      </div>

      <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
        <span class="min-w-20 text-sm font-medium text-highlighted"
          >Размер:</span
        >

        <span>{{ detail.properties.size }}</span>
      </div>

      <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
        <span class="min-w-20 text-sm font-medium text-highlighted"
          >Скорость:</span
        >

        <span>{{ detail.properties.speed }}</span>
      </div>
    </div>

    <SpeciesBody
      v-if="detail"
      :species="detail"
    />
  </UiDrawer>
</template>
