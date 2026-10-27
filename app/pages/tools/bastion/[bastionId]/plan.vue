<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  import { Role } from '~/shared/types';
  import {
    BASTION_DETAIL_LABELS,
    fetchPlayerBastion,
    getBastionErrorMessage,
    getBastionRoute,
    PLAN_LABELS,
  } from '~bastion-game/model';
  import { PlanEditor } from '~bastion-game/plan';
  import { UiResult } from '~ui/result';

  // Бастионы пока открыты только админам
  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  const route = useRoute();

  const bastionId = computed(() =>
    typeof route.params.bastionId === 'string' ? route.params.bastionId : '',
  );

  const {
    data: bastion,
    status,
    error,
  } = useAsyncData(
    () => `player-bastion-${bastionId.value}`,
    () => fetchPlayerBastion(bastionId.value),
    { server: false, lazy: true },
  );

  useSeoMeta({
    title: () =>
      bastion.value
        ? `${PLAN_LABELS.title}: ${bastion.value.name}`
        : PLAN_LABELS.title,
    robots: 'noindex',
  });

  const bastionRoute = computed(() => getBastionRoute(bastionId.value));

  const errorTitle = computed(() =>
    error.value?.statusCode === StatusCodes.FORBIDDEN
      ? BASTION_DETAIL_LABELS.forbidden
      : BASTION_DETAIL_LABELS.loadError,
  );

  const errorDetails = computed(() => {
    const message = getBastionErrorMessage(error.value, errorTitle.value);

    return message === errorTitle.value ? undefined : message;
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="bastion?.name ?? PLAN_LABELS.title"
  >
    <template #actions>
      <UButton
        :to="bastionRoute"
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
      status="error"
      :title="errorTitle"
      :sub-title="errorDetails"
    />

    <PlanEditor
      v-else
      :bastion
    />
  </NuxtLayout>
</template>
