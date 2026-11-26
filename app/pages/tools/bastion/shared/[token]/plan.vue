<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  import { Role } from '~/shared/types';
  import {
    BASTION_DETAIL_LABELS,
    BASTION_SHARE_LABELS,
    fetchSharedBastion,
    getBastionDataKey,
    getBastionErrorMessage,
    getSharedBastionRoute,
    PLAN_LABELS,
  } from '~bastion-game/model';
  import { PlanEditor } from '~bastion-game/plan';
  import { fillTemplate } from '~bastions/model';
  import { UiResult } from '~ui/result';

  // Бастионы пока открыты только админам
  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  /** План бастиона по ссылке «поделиться»: только просмотр. */
  const route = useRoute();

  const token = computed(() =>
    typeof route.params.token === 'string' ? route.params.token : '',
  );

  const {
    data: sharedAccess,
    status,
    error,
  } = useAsyncData(
    () => getBastionDataKey('shared', token.value),
    () => fetchSharedBastion(token.value),
    { server: false, lazy: true },
  );

  const bastion = computed(() => sharedAccess.value?.bastion);

  useSeoMeta({
    title: () =>
      bastion.value
        ? fillTemplate(PLAN_LABELS.pageTitle, {
            title: PLAN_LABELS.title,
            name: bastion.value.name,
          })
        : PLAN_LABELS.title,
    robots: 'noindex',
  });

  const backRoute = computed(() => getSharedBastionRoute(token.value));

  const isLoading = computed(
    () => status.value === 'pending' || status.value === 'idle',
  );

  const isNotFound = computed(
    () => error.value?.statusCode === StatusCodes.NOT_FOUND,
  );

  const resultStatus = computed<'404' | 'error'>(() =>
    isNotFound.value ? '404' : 'error',
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
      v-if="isLoading"
      class="h-[70vh]"
    />

    <UiResult
      v-else-if="status === 'error' || !bastion"
      :status="resultStatus"
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
