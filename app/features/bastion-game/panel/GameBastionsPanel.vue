<script setup lang="ts">
  import type { PlayerBastion, PlayerBastionMemberRequest } from '../model';

  import { UiModalActions } from '~ui/modal-actions';
  import { UiResult } from '~ui/result';

  import { useGameBastions } from '../composables';
  import { BASTION_GAME_LABELS } from '../model';
  import { BastionCard, BastionFormModal } from './ui';

  /**
   * Вкладка «Бастионы» на странице игры: все бастионы игры, а для мастера —
   * создание, правка состава и архив.
   */
  const { gameId } = defineProps<{
    gameId: string;
  }>();

  const { user } = useUser();

  const { overview, status, refresh, isSaving, create, update, archive } =
    useGameBastions(() => gameId);

  const isFormOpen = ref(false);
  const editedBastion = ref<PlayerBastion>();
  const archivedBastion = ref<PlayerBastion>();

  const isArchiveOpen = computed({
    get: () => !!archivedBastion.value,
    set: (opened: boolean) => {
      if (!opened) {
        archivedBastion.value = undefined;
      }
    },
  });

  const bastions = computed(() => overview.value?.bastions ?? []);
  const players = computed(() => overview.value?.players ?? []);
  const canCreate = computed(() => !!overview.value?.canCreate);
  const currentUserId = computed(() => user.value?.id ?? undefined);

  const emptyDescription = computed(() =>
    canCreate.value
      ? BASTION_GAME_LABELS.emptyMaster
      : BASTION_GAME_LABELS.emptyPlayer,
  );

  /** Открывает форму создания. */
  function openCreate(): void {
    editedBastion.value = undefined;
    isFormOpen.value = true;
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
   * Сохраняет форму: создаёт бастион или правит выбранный.
   *
   * @param name Название.
   * @param members Игроки с доступом.
   */
  async function handleSubmit(
    name: string,
    members: Array<PlayerBastionMemberRequest>,
  ): Promise<void> {
    const bastion = editedBastion.value;

    const saved = bastion
      ? await update(bastion.id, { name, members, version: bastion.version })
      : await create({ gameId, name, members });

    if (saved) {
      isFormOpen.value = false;
    }
  }

  /** Отправляет выбранный бастион в архив. */
  async function confirmArchive(): Promise<void> {
    const bastion = archivedBastion.value;

    if (bastion && (await archive(bastion.id))) {
      archivedBastion.value = undefined;
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
        v-if="canCreate"
        icon="tabler:plus"
        @click.left.exact.prevent="openCreate"
      >
        {{ BASTION_GAME_LABELS.create }}
      </UButton>
    </div>

    <div
      v-if="status === 'pending' || status === 'idle'"
      class="grid gap-4 md:grid-cols-2"
    >
      <USkeleton
        v-for="index in 2"
        :key="index"
        class="h-44"
      />
    </div>

    <UiResult
      v-else-if="status === 'error'"
      status="error"
      :title="BASTION_GAME_LABELS.loadError"
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
        {{ emptyDescription }}
      </p>
    </div>

    <div
      v-else
      class="grid gap-4 md:grid-cols-2"
    >
      <BastionCard
        v-for="bastion in bastions"
        :key="bastion.id"
        :bastion
        :current-user-id
        @edit="openEdit(bastion)"
        @archive="archivedBastion = bastion"
      />
    </div>

    <BastionFormModal
      v-model:open="isFormOpen"
      :players
      :bastion="editedBastion"
      :loading="isSaving"
      @submit="handleSubmit"
    />

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
