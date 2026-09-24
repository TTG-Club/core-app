<script setup lang="ts">
  import type { PlayerBastion } from '~bastion-game/model';

  import { StatusCodes } from 'http-status-codes';

  import { MemberFacilitiesCard } from '~bastion-game/facilities';
  import {
    activatePlayerBastion,
    BASTION_DETAIL_LABELS,
    BASTION_GAME_LABELS,
    fetchPlayerBastion,
    getBastionErrorMessage,
    PLAN_LABELS,
    PLAYER_BASTION_STATUS_COLORS,
    PLAYER_BASTION_STATUS_LABELS,
  } from '~bastion-game/model';
  import { UiResult } from '~ui/result';

  const route = useRoute();

  const gameId = computed(() =>
    typeof route.params.gameId === 'string' ? route.params.gameId : '',
  );

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
    title: () => bastion.value?.name ?? BASTION_DETAIL_LABELS.seoTitle,
    robots: 'noindex',
  });

  const gameRoute = computed(() => `/games/${gameId.value}`);

  const planRoute = computed(
    () => `/games/${gameId.value}/bastions/${bastionId.value}/plan`,
  );

  const toast = useToast();
  const isActivating = ref(false);

  /** Мастер может запустить бастион, пока тот в закладке. */
  const canActivate = computed(
    () => !!bastion.value?.canManage && bastion.value.status === 'SETUP',
  );

  /** Запускает бастион: закладка закончена, начинаются ходы. */
  async function activate(): Promise<void> {
    isActivating.value = true;

    try {
      bastion.value = await activatePlayerBastion(bastionId.value);
      toast.add({ title: BASTION_DETAIL_LABELS.activated, color: 'success' });
    } catch (activationError) {
      toast.add({
        title: BASTION_DETAIL_LABELS.activateError,
        description: getBastionErrorMessage(
          activationError,
          BASTION_DETAIL_LABELS.activateError,
        ),
        color: 'error',
      });
    } finally {
      isActivating.value = false;
    }
  }

  /**
   * Подменяет бастион ответом сервера после правки: в нём новая версия, и
   * следующая правка не упрётся в 409.
   *
   * @param updated Бастион после сохранения.
   */
  function handleUpdated(updated: PlayerBastion): void {
    bastion.value = updated;
  }

  /** Что случилось: чужая игра, бастиона нет или сбой. */
  const errorTitle = computed(() => {
    switch (error.value?.statusCode) {
      case StatusCodes.FORBIDDEN:
        return BASTION_DETAIL_LABELS.forbidden;
      case StatusCodes.NOT_FOUND:
        return BASTION_DETAIL_LABELS.notFound;
      default:
        return BASTION_DETAIL_LABELS.loadError;
    }
  });

  /** Текст сервера под заголовком, если он добавляет подробности. */
  const errorDetails = computed(() => {
    const message = getBastionErrorMessage(error.value, errorTitle.value);

    return message === errorTitle.value ? undefined : message;
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="bastion?.name"
  >
    <template #actions>
      <UButton
        :to="gameRoute"
        icon="tabler:arrow-left"
        color="neutral"
        variant="ghost"
      >
        {{ BASTION_DETAIL_LABELS.back }}
      </UButton>
    </template>

    <div class="flex flex-col gap-6">
      <div
        v-if="status === 'pending' || status === 'idle'"
        class="flex flex-col gap-3"
      >
        <USkeleton class="h-8 w-1/3" />

        <USkeleton class="h-40" />
      </div>

      <UiResult
        v-else-if="status === 'error' || !bastion"
        status="error"
        :title="errorTitle"
        :sub-title="errorDetails"
      />

      <template v-else>
        <div class="flex flex-wrap items-center gap-3 text-sm text-muted">
          <UBadge
            :color="PLAYER_BASTION_STATUS_COLORS[bastion.status]"
            variant="subtle"
          >
            {{ PLAYER_BASTION_STATUS_LABELS[bastion.status] }}
          </UBadge>

          <span class="tabular-nums">
            {{ BASTION_GAME_LABELS.turn }}: {{ bastion.turn }}
          </span>

          <span class="tabular-nums">
            {{ BASTION_GAME_LABELS.treasury }}: {{ bastion.treasuryGp }}
            {{ BASTION_GAME_LABELS.gold }}
          </span>

          <div class="ml-auto flex flex-wrap gap-2">
            <UButton
              :to="planRoute"
              icon="tabler:map-2"
              variant="subtle"
            >
              {{ PLAN_LABELS.open }}
            </UButton>

            <UButton
              v-if="canActivate"
              icon="tabler:player-play"
              :loading="isActivating"
              @click.left.exact.prevent="activate"
            >
              {{ BASTION_DETAIL_LABELS.activate }}
            </UButton>
          </div>
        </div>

        <p
          v-if="canActivate"
          class="text-sm text-muted"
        >
          {{ BASTION_DETAIL_LABELS.activateHint }}
        </p>

        <h2 class="text-base font-semibold text-highlighted">
          {{ BASTION_DETAIL_LABELS.members }}
        </h2>

        <p
          v-if="!bastion.members.length"
          class="text-sm text-muted"
        >
          {{ BASTION_GAME_LABELS.noMembers }}
        </p>

        <MemberFacilitiesCard
          v-for="member in bastion.members"
          :key="member.id"
          :bastion
          :member
          @updated="handleUpdated"
        />
      </template>
    </div>
  </NuxtLayout>
</template>
