<script setup lang="ts">
  import type { BastionShareAccess } from '~bastion-game/model';

  import { StatusCodes } from 'http-status-codes';

  import { Role } from '~/shared/types';
  import { MemberFacilitiesCard } from '~bastion-game/facilities';
  import {
    BASTION_DETAIL_LABELS,
    BASTION_GAME_LABELS,
    BASTION_SHARE_LABELS,
    fetchSharedBastion,
    getBastionDataKey,
    getBastionErrorMessage,
    getBastionRoute,
    getSharedBastionPlanRoute,
    isBastionStatusShown,
    PLAN_LABELS,
    PLAYER_BASTION_STATUS_COLORS,
    PLAYER_BASTION_STATUS_LABELS,
    requestBastionEdit,
  } from '~bastion-game/model';
  import { UiResult } from '~ui/result';
  import { AuthModal } from '~user/auth-modal';

  // Бастионы пока открыты только админам
  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  /**
   * Бастион по ссылке «поделиться», как лист персонажа: открывается кем
   * угодно и только на чтение. Вошедший может попросить у владельца право
   * на правку; получив его, он открывает бастион как обычно.
   */
  const route = useRoute();
  const toast = useToast();
  const { isLoggedIn } = useUser();

  const token = computed(() =>
    typeof route.params.token === 'string' ? route.params.token : '',
  );

  const {
    data: sharedBastion,
    status,
    error,
    refresh,
  } = useAsyncData(
    () => getBastionDataKey('shared', token.value),
    () => fetchSharedBastion(token.value),
    { server: false, lazy: true },
  );

  useSeoMeta({
    title: () =>
      sharedBastion.value?.bastion.name ?? BASTION_SHARE_LABELS.sharedTitle,
    robots: 'noindex',
  });

  const bastion = computed(() => sharedBastion.value?.bastion);
  const isAuthOpen = ref(false);
  const isRequesting = ref(false);

  const planRoute = computed(() => getSharedBastionPlanRoute(token.value));

  const bastionRoute = computed(() =>
    bastion.value ? getBastionRoute(bastion.value.id) : undefined,
  );

  // Доступ зависит от того, кто открыл: после входа он другой.
  watch(isLoggedIn, () => refresh());

  const isNotFound = computed(
    () => error.value?.statusCode === StatusCodes.NOT_FOUND,
  );

  const isLoading = computed(
    () => status.value === 'pending' || status.value === 'idle',
  );

  /** Вид заглушки ошибки: «не найдено» или общая ошибка. */
  const resultStatus = computed(() => (isNotFound.value ? '404' : 'error'));

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

  /**
   * Запоминает новый доступ, не перечитывая бастион.
   *
   * @param access Доступ после запроса.
   */
  function setAccess(access: BastionShareAccess): void {
    if (sharedBastion.value) {
      sharedBastion.value = { ...sharedBastion.value, access };
    }
  }

  /** Просит у владельца право на правку. */
  async function requestEdit(): Promise<void> {
    isRequesting.value = true;

    try {
      setAccess(await requestBastionEdit(token.value));
      toast.add({ title: BASTION_SHARE_LABELS.requested, color: 'success' });
    } catch (requestError) {
      toast.add({
        title: BASTION_SHARE_LABELS.error,
        description: getBastionErrorMessage(
          requestError,
          BASTION_SHARE_LABELS.error,
        ),
        color: 'error',
      });
    } finally {
      isRequesting.value = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="bastion?.name ?? BASTION_SHARE_LABELS.sharedTitle"
  >
    <div class="flex flex-col gap-6">
      <div
        v-if="isLoading"
        class="flex flex-col gap-3"
      >
        <USkeleton class="h-8 w-1/3" />

        <USkeleton class="h-40" />
      </div>

      <UiResult
        v-else-if="status === 'error' || !sharedBastion || !bastion"
        :status="resultStatus"
        :title="errorTitle"
        :sub-title="errorDetails"
      />

      <template v-else>
        <div class="flex flex-wrap items-center gap-3 text-sm text-muted">
          <UBadge
            v-if="isBastionStatusShown(bastion.status)"
            :color="PLAYER_BASTION_STATUS_COLORS[bastion.status]"
            variant="subtle"
          >
            {{ PLAYER_BASTION_STATUS_LABELS[bastion.status] }}
          </UBadge>

          <UBadge
            color="neutral"
            variant="outline"
            icon="tabler:eye"
          >
            {{ BASTION_SHARE_LABELS.readOnly }}
          </UBadge>

          <span class="tabular-nums">
            {{ BASTION_GAME_LABELS.turn }}: {{ bastion.turn }}
          </span>

          <span class="tabular-nums">
            {{ BASTION_GAME_LABELS.treasury }}: {{ bastion.treasuryGp }}
            {{ BASTION_GAME_LABELS.gold }}
          </span>

          <div class="ml-auto flex flex-wrap items-center gap-2">
            <UButton
              :to="planRoute"
              icon="tabler:map-2"
              variant="subtle"
            >
              {{ PLAN_LABELS.open }}
            </UButton>

            <UButton
              v-if="sharedBastion.access === 'ANONYMOUS'"
              icon="tabler:login"
              color="neutral"
              variant="outline"
              @click.left.exact.prevent="isAuthOpen = true"
            >
              {{ BASTION_SHARE_LABELS.signIn }}
            </UButton>

            <UButton
              v-else-if="sharedBastion.access === 'NONE'"
              icon="tabler:pencil-question"
              :loading="isRequesting"
              @click.left.exact.prevent="requestEdit"
            >
              {{ BASTION_SHARE_LABELS.requestEdit }}
            </UButton>

            <UBadge
              v-else-if="sharedBastion.access === 'PENDING'"
              color="warning"
              variant="subtle"
              size="lg"
            >
              {{ BASTION_SHARE_LABELS.requestSent }}
            </UBadge>

            <UButton
              v-else-if="bastionRoute"
              :to="bastionRoute"
              icon="tabler:pencil"
            >
              {{ BASTION_SHARE_LABELS.open }}
            </UButton>
          </div>
        </div>

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
        />
      </template>
    </div>

    <AuthModal v-model="isAuthOpen" />
  </NuxtLayout>
</template>
