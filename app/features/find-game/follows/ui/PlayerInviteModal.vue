<script setup lang="ts">
  import { UiModalActions } from '~ui/modal-actions';

  import { useFindGameToast } from '../../composables';
  import {
    CANCEL_LABEL,
    fetchMyGames,
    INVITE_GAME_LABEL,
    INVITE_GAME_PLACEHOLDER,
    INVITE_NO_GAMES_HINT,
    INVITE_PLAYER_DESCRIPTION,
    INVITE_PLAYER_LABEL,
    INVITE_PLAYER_TITLE,
    INVITE_SENT_TOAST,
    invitePlayer,
    MY_GAMES_PAGE_SIZE,
  } from '../../model';

  /**
   * Приглашение отмеченного игрока в свою игру.
   *
   * Зовут ссылкой, а не местом в составе: игрок получает уведомление и подаёт
   * заявку сам. Взять человека в игру, не спросив его, значило бы записать
   * его в чужое расписание.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { playerId, playerName } = defineProps<{
    /** Кого зовут; `null` — окно закрыто. */
    playerId: string | null;
    playerName: string;
  }>();

  const { showError, showSuccess } = useFindGameToast();
  const pickedGameId = ref<string>('');
  const isSending = ref(false);

  // Звать можно только туда, где открыт набор: в закрытую игру сервис
  // приглашение не примет.
  const { data: games, status } = useAsyncData(
    'find-game-invitable-games',
    async () => {
      const page = await fetchMyGames(0, MY_GAMES_PAGE_SIZE, ['OPEN']);

      return page.content.filter((game) => !game.recruitmentClosed);
    },
    { server: false, deep: false, default: () => [] },
  );

  const gameItems = computed(() =>
    games.value.map((game) => ({ label: game.title, value: game.id })),
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const isEmpty = computed(() => !isLoading.value && !gameItems.value.length);

  // Подсказка появляется только когда звать некуда: у поля с играми она была
  // бы шумом.
  const gamesHint = computed(() => (isEmpty.value ? INVITE_NO_GAMES_HINT : ''));

  /** Закрывает окно, не приглашая. */
  function close(): void {
    isOpen.value = false;
  }

  /** Отправляет приглашение и закрывает окно. */
  async function submit(): Promise<void> {
    if (!playerId || !pickedGameId.value) {
      return;
    }

    isSending.value = true;

    try {
      await invitePlayer(pickedGameId.value, playerId);

      showSuccess(INVITE_SENT_TOAST);

      isOpen.value = false;
    } catch (error) {
      showError(error);
    } finally {
      isSending.value = false;
    }
  }

  // Выбор чистится на каждом открытии: прошлая игра к новому игроку
  // отношения не имеет.
  watch(isOpen, (opened) => {
    if (opened) {
      pickedGameId.value = '';
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="INVITE_PLAYER_TITLE"
    :description="playerName"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">{{ INVITE_PLAYER_DESCRIPTION }}</p>

        <UFormField
          :label="INVITE_GAME_LABEL"
          :hint="gamesHint"
        >
          <USelect
            v-model="pickedGameId"
            :items="gameItems"
            value-key="value"
            :loading="isLoading"
            :disabled="isEmpty"
            :placeholder="INVITE_GAME_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="CANCEL_LABEL"
        :submit-label="INVITE_PLAYER_LABEL"
        submit-icon="tabler:mail"
        :loading="isSending"
        :disabled="!pickedGameId"
        @cancel="close"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
