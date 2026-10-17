<script setup lang="ts">
  import type { PlayerBastion } from '~bastion-game/model';

  import { StatusCodes } from 'http-status-codes';

  import {
    BastionActionsBar,
    BastionDefenseWalls,
    BastionGuests,
    BastionJournal,
    BastionPendingEvents,
  } from '~bastion-game/activity';
  import { MemberFacilitiesCard } from '~bastion-game/facilities';
  import {
    activatePlayerBastion,
    BASTION_DETAIL_LABELS,
    BASTION_EDIT_LABELS,
    BASTION_GAME_LABELS,
    fetchBastionActivity,
    fetchPlayerBastion,
    getBastionErrorMessage,
    getBastionPlanRoute,
    getGameRoute,
    isBastionStatusShown,
    MY_BASTIONS_ROUTE,
    PLAN_LABELS,
    PLAYER_BASTION_STATUS_COLORS,
    PLAYER_BASTION_STATUS_LABELS,
  } from '~bastion-game/model';
  import { UiResult } from '~ui/result';

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

  /** Журнал бастиона: приказы, ходы и движения казны. */
  const { data: activity, refresh: refreshActivity } = useAsyncData(
    () => `player-bastion-activity-${bastionId.value}`,
    () => fetchBastionActivity(bastionId.value),
    { server: false, lazy: true },
  );

  useSeoMeta({
    title: () => bastion.value?.name ?? BASTION_DETAIL_LABELS.seoTitle,
    robots: 'noindex',
  });

  /** Назад — в игру, если бастион в ней, иначе к своим бастионам. */
  const backRoute = computed(() =>
    bastion.value?.gameId
      ? getGameRoute(bastion.value.gameId)
      : MY_BASTIONS_ROUTE,
  );

  const backLabel = computed(() =>
    bastion.value?.gameId
      ? BASTION_DETAIL_LABELS.back
      : BASTION_DETAIL_LABELS.backToMine,
  );

  const planRoute = computed(() => getBastionPlanRoute(bastionId.value));

  const toast = useToast();
  const isActivating = ref(false);

  const isStatusShown = computed(
    () => !!bastion.value && isBastionStatusShown(bastion.value.status),
  );

  /** Режим редактирования: стройка, новые и разрушение сооружений, стены. */
  const isEditing = ref(false);

  /** Редактировать есть что: бастион не в архиве, и открывший может строить. */
  const canToggleEditing = computed(
    () =>
      !!bastion.value
      && bastion.value.status !== 'ARCHIVED'
      && (bastion.value.canEdit
        || bastion.value.members.some(
          (member) => member.canGiveOrders || member.canEditFacilities,
        )),
  );

  const editButtonLabel = computed(() =>
    isEditing.value ? BASTION_EDIT_LABELS.done : BASTION_EDIT_LABELS.edit,
  );

  const editButtonIcon = computed(() =>
    isEditing.value ? 'tabler:check' : 'tabler:pencil',
  );

  /** Тот, кто ведёт бастион, может запустить его, пока тот в закладке. */
  const canActivate = computed(
    () => !!bastion.value?.canManage && bastion.value.status === 'SETUP',
  );

  /** Запускает бастион: закладка закончена, начинаются ходы. */
  async function activate(): Promise<void> {
    isActivating.value = true;

    try {
      bastion.value = await activatePlayerBastion(bastionId.value);
      await refreshActivity();
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
  async function handleUpdated(updated: PlayerBastion): Promise<void> {
    bastion.value = updated;
    await refreshActivity();
  }

  /** Что случилось: чужой бастион, бастиона нет или сбой. */
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
        :to="backRoute"
        icon="tabler:arrow-left"
        color="neutral"
        variant="ghost"
      >
        {{ backLabel }}
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
            v-if="isStatusShown"
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

            <UTooltip
              v-if="canToggleEditing"
              :text="BASTION_EDIT_LABELS.hint"
            >
              <UButton
                :icon="editButtonIcon"
                :variant="isEditing ? 'solid' : 'subtle'"
                :color="isEditing ? 'primary' : 'neutral'"
                @click.left.exact.prevent="isEditing = !isEditing"
              >
                {{ editButtonLabel }}
              </UButton>
            </UTooltip>

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

        <BastionActionsBar
          :bastion
          :activity="activity ?? undefined"
          @updated="handleUpdated"
        />

        <BastionPendingEvents
          :bastion
          :activity="activity ?? undefined"
          @updated="handleUpdated"
        />

        <BastionGuests
          :bastion
          @updated="handleUpdated"
        />

        <BastionDefenseWalls
          :bastion
          :editing="isEditing"
          @updated="handleUpdated"
        />

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
          :activity="activity ?? undefined"
          :editing="isEditing"
          @updated="handleUpdated"
        />

        <BastionJournal
          v-if="bastion.status !== 'SETUP'"
          :bastion
          :activity="activity ?? undefined"
          @updated="handleUpdated"
        />
      </template>
    </div>
  </NuxtLayout>
</template>
