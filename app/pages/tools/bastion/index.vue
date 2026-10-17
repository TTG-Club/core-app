<script setup lang="ts">
  import type {
    CreatePlayerBastionRequest,
    PlayerBastion,
    PlayerBastionMemberRequest,
  } from '~bastion-game/model';

  import { Role } from '~/shared/types';
  import { useMyBastions } from '~bastion-game/composables';
  import {
    BASTION_GAME_LABELS,
    BASTION_SHARE_LABELS,
    MY_BASTIONS_LABELS,
  } from '~bastion-game/model';
  import {
    BastionCard,
    BastionCreateModal,
    BastionFormModal,
    BastionShareModal,
  } from '~bastion-game/panel';
  import { fillTemplate } from '~bastions/model';
  import { UiModalActions } from '~ui/modal-actions';
  import { UiResult } from '~ui/result';

  /**
   * «Мои бастионы»: свои бастионы, как листы персонажа. Здесь бастион
   * создают, переименовывают, удаляют и убирают из игры; в игру он
   * добавляется со страницы игры.
   */
  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  useSeoMeta({
    title: MY_BASTIONS_LABELS.title,
    robots: 'noindex',
  });

  const { user } = useUser();

  const {
    bastions,
    sharedBastions,
    limit,
    subscriberLimit,
    canCreate,
    status,
    errorMessage,
    refresh,
    isSaving,
    create,
    update,
    remove,
    leaveGame,
  } = useMyBastions();

  const currentUserId = computed(() => user.value?.id ?? undefined);

  const isCreateOpen = ref(false);
  const isFormOpen = ref(false);
  const editedBastion = ref<PlayerBastion>();
  const removedBastion = ref<PlayerBastion>();
  const leavingBastion = ref<PlayerBastion>();
  const sharingBastion = ref<PlayerBastion>();

  const isRemoveOpen = computed({
    get: () => !!removedBastion.value,
    set: (opened: boolean) => {
      if (!opened) {
        removedBastion.value = undefined;
      }
    },
  });

  const isLeaveOpen = computed({
    get: () => !!leavingBastion.value,
    set: (opened: boolean) => {
      if (!opened) {
        leavingBastion.value = undefined;
      }
    },
  });

  const isShareOpen = computed({
    get: () => !!sharingBastion.value,
    set: (opened: boolean) => {
      if (!opened) {
        sharingBastion.value = undefined;
      }
    },
  });

  const isLoading = computed(
    () => status.value === 'pending' || status.value === 'idle',
  );

  const counterText = computed(() =>
    fillTemplate(MY_BASTIONS_LABELS.counter, {
      count: bastions.value.length,
      limit: limit.value,
    }),
  );

  /** Подсказка про подписку — только тем, кому она прибавит бастионов. */
  const subscriberHint = computed(() =>
    subscriberLimit.value > limit.value
      ? fillTemplate(MY_BASTIONS_LABELS.subscriberHint, {
          limit: subscriberLimit.value,
        })
      : undefined,
  );

  const counterClass = computed(() =>
    canCreate.value ? 'text-muted' : 'text-error',
  );

  /**
   * Пояснение под заголовком ошибки — текст сервера, если он что-то добавляет.
   */
  const errorDetails = computed(() =>
    errorMessage.value === MY_BASTIONS_LABELS.loadError
      ? undefined
      : errorMessage.value,
  );

  /** Открывает создание бастиона. */
  function openCreate(): void {
    isCreateOpen.value = true;
  }

  /**
   * Создаёт бастион.
   *
   * @param request Название и персонаж владельца.
   */
  async function handleCreate(
    request: CreatePlayerBastionRequest,
  ): Promise<void> {
    if (await create(request)) {
      isCreateOpen.value = false;
    }
  }

  /**
   * Открывает правку бастиона.
   *
   * @param bastion Бастион.
   */
  function openEdit(bastion: PlayerBastion): void {
    editedBastion.value = bastion;
    isFormOpen.value = true;
  }

  /**
   * Сохраняет название и состав редактируемого бастиона.
   *
   * @param name Название.
   * @param members Персонажи с доступом.
   */
  async function handleSubmit(
    name: string,
    members: Array<PlayerBastionMemberRequest>,
  ): Promise<void> {
    const bastion = editedBastion.value;

    if (
      bastion
      && (await update(bastion.id, { name, members, version: bastion.version }))
    ) {
      isFormOpen.value = false;
    }
  }

  /**
   * Подменяет бастион в окне «Поделиться» ответом сервера и обновляет список:
   * на карточке меняется число запросов на правку.
   *
   * @param updated Бастион после изменения доступа.
   */
  async function handleShared(updated: PlayerBastion): Promise<void> {
    sharingBastion.value = updated;
    await refresh();
  }

  /** Удаляет выбранный бастион. */
  async function confirmRemove(): Promise<void> {
    const bastion = removedBastion.value;

    if (bastion && (await remove(bastion.id))) {
      removedBastion.value = undefined;
    }
  }

  /** Убирает выбранный бастион из игры. */
  async function confirmLeave(): Promise<void> {
    const bastion = leavingBastion.value;

    if (bastion && (await leaveGame(bastion.id))) {
      leavingBastion.value = undefined;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="MY_BASTIONS_LABELS.title"
  >
    <template #actions>
      <UButton
        icon="tabler:plus"
        :disabled="!canCreate"
        @click.left.exact.prevent="openCreate"
      >
        {{ MY_BASTIONS_LABELS.create }}
      </UButton>
    </template>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <p class="max-w-3xl text-sm text-muted">
          {{ MY_BASTIONS_LABELS.description }}
        </p>

        <p
          v-if="!isLoading && status !== 'error'"
          class="text-sm tabular-nums"
          :class="counterClass"
        >
          {{ counterText }}
          <template v-if="!canCreate">
            · {{ MY_BASTIONS_LABELS.limitReached }}
          </template>
        </p>

        <p
          v-if="subscriberHint"
          class="text-xs text-muted"
        >
          {{ subscriberHint }}
        </p>
      </div>

      <div
        v-if="isLoading"
        class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-44"
        />
      </div>

      <UiResult
        v-else-if="status === 'error'"
        status="error"
        :title="MY_BASTIONS_LABELS.loadError"
        :sub-title="errorDetails"
      >
        <template #extra>
          <UButton
            icon="tabler:reload"
            @click.left.exact.prevent="refresh()"
          >
            {{ BASTION_GAME_LABELS.retry }}
          </UButton>
        </template>
      </UiResult>

      <div
        v-else-if="!bastions.length"
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-default p-8 text-center"
      >
        <UIcon
          name="tabler:building-castle"
          class="size-8 text-muted"
        />

        <p class="font-medium text-highlighted">
          {{ MY_BASTIONS_LABELS.empty }}
        </p>

        <p class="text-sm text-muted">
          {{ MY_BASTIONS_LABELS.emptyDescription }}
        </p>
      </div>

      <div
        v-else
        class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <BastionCard
          v-for="bastion in bastions"
          :key="bastion.id"
          :bastion
          :current-user-id
          show-game
          can-remove
          @edit="openEdit(bastion)"
          @leave="leavingBastion = bastion"
          @remove="removedBastion = bastion"
          @share="sharingBastion = bastion"
        />
      </div>

      <section
        v-if="!isLoading && sharedBastions.length"
        class="flex flex-col gap-3"
      >
        <div class="flex flex-col gap-1">
          <h2 class="text-base font-semibold text-highlighted">
            {{ BASTION_SHARE_LABELS.sharedWithMe }}
          </h2>

          <p class="text-sm text-muted">
            {{ BASTION_SHARE_LABELS.sharedWithMeHint }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BastionCard
            v-for="bastion in sharedBastions"
            :key="bastion.id"
            :bastion
            show-game
          />
        </div>
      </section>
    </div>

    <BastionCreateModal
      v-model:open="isCreateOpen"
      :loading="isSaving"
      @submit="handleCreate"
    />

    <BastionFormModal
      v-model:open="isFormOpen"
      :players="[]"
      :bastion="editedBastion"
      :loading="isSaving"
      @submit="handleSubmit"
    />

    <BastionShareModal
      v-if="sharingBastion"
      v-model:open="isShareOpen"
      :bastion="sharingBastion"
      @updated="handleShared"
    />

    <UModal
      v-model:open="isRemoveOpen"
      :title="MY_BASTIONS_LABELS.removeConfirmTitle"
      :description="MY_BASTIONS_LABELS.removeConfirmDescription"
    >
      <template #footer>
        <UiModalActions
          :cancel-label="BASTION_GAME_LABELS.cancel"
          :submit-label="MY_BASTIONS_LABELS.removeConfirm"
          submit-icon="tabler:trash"
          :loading="isSaving"
          @cancel="isRemoveOpen = false"
          @submit="confirmRemove"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="isLeaveOpen"
      :title="BASTION_GAME_LABELS.leaveGameConfirmTitle"
      :description="BASTION_GAME_LABELS.leaveGameConfirmDescription"
    >
      <template #footer>
        <UiModalActions
          :cancel-label="BASTION_GAME_LABELS.cancel"
          :submit-label="BASTION_GAME_LABELS.leaveGameConfirm"
          submit-icon="tabler:door-exit"
          :loading="isSaving"
          @cancel="isLeaveOpen = false"
          @submit="confirmLeave"
        />
      </template>
    </UModal>
  </NuxtLayout>
</template>
