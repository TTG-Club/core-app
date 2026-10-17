<script setup lang="ts">
  import type { PlayerBastion, PlayerBastionMemberRequest } from '../model';

  import { UiModalActions } from '~ui/modal-actions';
  import { UiResult } from '~ui/result';

  import { useGameBastions, useMyBastions } from '../composables';
  import { BASTION_GAME_LABELS } from '../model';
  import {
    BastionCard,
    BastionFormModal,
    BastionJoinModal,
    BastionShareModal,
  } from './ui';

  /**
   * Вкладка «Бастионы» на странице игры: все бастионы игры, добавление своего
   * бастиона, а для мастера — правка состава, архив и уход из игры.
   */
  const { gameId } = defineProps<{
    gameId: string;
  }>();

  const { user } = useUser();

  const {
    overview,
    status,
    errorMessage,
    refresh,
    isSaving,
    join,
    leave,
    update,
    archive,
  } = useGameBastions(() => gameId);

  // Свои бастионы нужны только окну добавления — грузятся при его открытии.
  const mine = useMyBastions({ immediate: false });

  /**
   * Пояснение под заголовком ошибки — текст сервера. Если сервер ничего не
   * объяснил, пояснения нет: общая фраза уже стоит в заголовке.
   */
  const errorDetails = computed(() =>
    errorMessage.value === BASTION_GAME_LABELS.loadError
      ? undefined
      : errorMessage.value,
  );

  const isFormOpen = ref(false);
  const isJoinOpen = ref(false);
  const editedBastion = ref<PlayerBastion>();
  const archivedBastion = ref<PlayerBastion>();
  const leavingBastion = ref<PlayerBastion>();
  const sharingBastion = ref<PlayerBastion>();

  const isArchiveOpen = computed({
    get: () => !!archivedBastion.value,
    set: (opened: boolean) => {
      if (!opened) {
        archivedBastion.value = undefined;
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

  const bastions = computed(() => overview.value?.bastions ?? []);
  const players = computed(() => overview.value?.players ?? []);
  const canAdd = computed(() => !!overview.value?.canAdd);
  const currentUserId = computed(() => user.value?.id ?? undefined);

  const mineErrorMessage = computed(() =>
    mine.status.value === 'error' ? mine.errorMessage.value : undefined,
  );

  /** Открывает выбор своего бастиона и перечитывает список своих. */
  async function openJoin(): Promise<void> {
    isJoinOpen.value = true;
    await mine.refresh();
  }

  /**
   * Добавляет выбранный свой бастион в игру.
   *
   * @param bastionId Бастион.
   */
  async function handleJoin(bastionId: string): Promise<void> {
    if (await join(bastionId)) {
      isJoinOpen.value = false;
    }
  }

  /**
   * Открывает форму правки бастиона.
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
   * @param members Игроки с доступом.
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

  /** Отправляет выбранный бастион в архив. */
  async function confirmArchive(): Promise<void> {
    const bastion = archivedBastion.value;

    if (bastion && (await archive(bastion.id))) {
      archivedBastion.value = undefined;
    }
  }

  /** Убирает выбранный бастион из игры. */
  async function confirmLeave(): Promise<void> {
    const bastion = leavingBastion.value;

    if (bastion && (await leave(bastion.id))) {
      leavingBastion.value = undefined;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex max-w-2xl flex-col gap-1">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ BASTION_GAME_LABELS.panelTitle }}
        </h2>

        <p class="text-sm text-muted">
          {{ BASTION_GAME_LABELS.panelDescription }}
        </p>
      </div>

      <UButton
        v-if="canAdd"
        icon="tabler:plus"
        @click.left.exact.prevent="openJoin"
      >
        {{ BASTION_GAME_LABELS.add }}
      </UButton>
    </div>

    <div
      v-if="status === 'pending' || status === 'idle'"
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
      :title="BASTION_GAME_LABELS.loadError"
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
        {{ BASTION_GAME_LABELS.empty }}
      </p>

      <p class="text-sm text-muted">
        {{ BASTION_GAME_LABELS.emptyDescription }}
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
        @edit="openEdit(bastion)"
        @archive="archivedBastion = bastion"
        @leave="leavingBastion = bastion"
        @share="sharingBastion = bastion"
      />
    </div>

    <BastionShareModal
      v-if="sharingBastion"
      v-model:open="isShareOpen"
      :bastion="sharingBastion"
      @updated="handleShared"
    />

    <BastionFormModal
      v-model:open="isFormOpen"
      :players
      :bastion="editedBastion"
      :loading="isSaving"
      @submit="handleSubmit"
    />

    <BastionJoinModal
      v-model:open="isJoinOpen"
      :bastions="mine.freeBastions.value"
      :pending="mine.status.value === 'pending'"
      :error-message="mineErrorMessage"
      :loading="isSaving"
      @submit="handleJoin"
    />

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

    <UModal
      v-model:open="isArchiveOpen"
      :title="BASTION_GAME_LABELS.archiveConfirmTitle"
      :description="BASTION_GAME_LABELS.archiveConfirmDescription"
    >
      <template #footer>
        <UiModalActions
          :cancel-label="BASTION_GAME_LABELS.cancel"
          :submit-label="BASTION_GAME_LABELS.archiveConfirm"
          submit-icon="tabler:archive"
          :loading="isSaving"
          @cancel="isArchiveOpen = false"
          @submit="confirmArchive"
        />
      </template>
    </UModal>
  </div>
</template>
