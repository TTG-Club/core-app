<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  import {
    BASTION_DETAIL_LABELS,
    BASTION_SHARE_LABELS,
    fetchSharedBastion,
    getBastionErrorMessage,
    getSharedBastionRoute,
    PLAN_LABELS,
  } from '~bastion-game/model';
  import { PlanEditor } from '~bastion-game/plan';
  import { UiResult } from '~ui/result';

  /** План бастиона по ссылке «поделиться»: только просмотр. */
  const route = useRoute();

  const token = computed(() =>
    typeof route.params.token === 'string' ? route.params.token : '',
  );

  const { data, status, error } = useAsyncData(
    () => `shared-player-bastion-${token.value}`,
    () => fetchSharedBastion(token.value),
    { server: false, lazy: true },
  );

  const bastion = computed(() => data.value?.bastion);

  useSeoMeta({
    title: () =>
      bastion.value
        ? `${PLAN_LABELS.title}: ${bastion.value.name}`
        : PLAN_LABELS.title,
    robots: 'noindex',
  });

  const backRoute = computed(() => getSharedBastionRoute(token.value));

  const isNotFound = computed(
    () => error.value?.statusCode === StatusCodes.NOT_FOUND,
  );

  const errorTitle = computed(() =>
    isNotFound.value
      ? BASTION_SHARE_LABELS.notFound
      : BASTION_DETAIL_LABELS.loadError,
  );

  const errorDetails = computed(() =>
    isNotFound.value
      ? BASTION_SHARE_LABELS.notFoundHint
      : getBastionErrorMessage(error.value, BASTION_DETAIL_LABELS.loadError),
  );
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="bastion?.name ?? PLAN_LABELS.title"
  >
    <template #actions>
      <UButton
        :to="backRoute"
        icon="tabler:arrow-left"
        color="neutral"
        variant="ghost"
      >
        {{ PLAN_LABELS.back }}
      </UButton>
    </template>

    <USkeleton
      v-if="status === 'pending' || status === 'idle'"
      class="h-[70vh]"
    />

    <UiResult
      v-else-if="status === 'error' || !bastion"
      :status="isNotFound ? '404' : 'error'"
      :title="errorTitle"
      :sub-title="errorDetails"
    />

    <PlanEditor
      v-else
      :bastion
      :share-token="token"
    />
  </NuxtLayout>
</template>
