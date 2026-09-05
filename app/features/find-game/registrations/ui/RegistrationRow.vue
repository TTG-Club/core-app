<script setup lang="ts">
  import type {
    GameRegistration,
    Reputation,
    SessionReview,
  } from '../../model';

  import { CharacterSheetDrawer } from '~character-sheet/drawer';

  import { useFollows } from '../../composables';
  import {
    BOOKMARK_PLAYER_ACTIVE_LABEL,
    BOOKMARK_PLAYER_HINT,
    BOOKMARK_PLAYER_LABEL,
    fetchPlayerReviews,
    getReputationLabel,
    PLAYER_REVIEWS_OPEN_LABEL,
    REGISTRATION_APPROVE_LABEL,
    REGISTRATION_CHARACTER_SHEET_LABEL,
    REGISTRATION_EXCLUDE_HINT,
    REGISTRATION_EXCLUDE_LABEL,
    REGISTRATION_REJECT_LABEL,
    REGISTRATIONS_FULL_HINT,
    REVIEW_DOWN_LABEL,
    REVIEW_UP_LABEL,
    REVIEWS_EMPTY_TITLE,
    SESSION_REGISTRATION_STATUS_COLORS,
    SESSION_REGISTRATION_STATUS_LABELS,
  } from '../../model';
  import { getSharedCharacterSheetToken } from '../../ui';

  const {
    registration,
    playerName,
    gameId,
    reputation = null,
    isFull,
    busy = false,
  } = defineProps<{
    registration: GameRegistration;
    /** Отображаемое имя игрока; сырой UUID показывать нельзя. */
    playerName: string;
    /** Игра, в которую подана заявка: по ней сервис пускает к отзывам. */
    gameId: string;
    /** Репутация игрока; `null` — ещё не загружена или сервис её не отдал. */
    reputation?: Reputation | null;
    /** Мест больше нет — принять ещё одного игрока сервис не даст. */
    isFull: boolean;
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    approve: [registrationId: string];
    reject: [registrationId: string];
  }>();

  const overlay = useOverlay();

  const isPending = computed(() => registration.status === 'PENDING');

  // Принятого игрока не отклоняют, а исключают: он уже в составе и уйдёт из
  // всех незакрытых сессий, поэтому решение подтверждают отдельно.
  const isApproved = computed(() => registration.status === 'APPROVED');

  const statusColor = computed(
    () => SESSION_REGISTRATION_STATUS_COLORS[registration.status],
  );

  // Лист персонажа сайта открывается на месте; чужая ссылка остаётся обычной
  // и уводит в новую вкладку.
  const sheetToken = computed(() =>
    getSharedCharacterSheetToken(registration.characterSheetUrl),
  );

  // Окно создаётся один раз при первом открытии: заявка в строке не меняется,
  // а создавать его заранее для каждой строки списка незачем.
  let sheetDrawer: ReturnType<typeof overlay.create> | undefined;

  /** Открывает лист персонажа игрока рядом со списком заявок. */
  function openCharacterSheet(): void {
    const token = sheetToken.value;

    if (!token) {
      return;
    }

    sheetDrawer ??= overlay.create(CharacterSheetDrawer, {
      props: {
        shareToken: token,
        onClose: () => sheetDrawer?.close(),
      },
    });

    sheetDrawer.open();
  }

  // Принять сверх максимума сервис не даст, поэтому кнопка гаснет заранее и
  // объясняет почему.
  const isApproveBlocked = computed(() => isPending.value && isFull);

  const reputationLabel = computed(() => getReputationLabel(reputation));

  const { busyUserId, isPlayerBookmarked, togglePlayer } = useFollows();

  const isBookmarked = computed(() =>
    isPlayerBookmarked(registration.playerId),
  );

  // Тексты отзывов подтягиваются по требованию: доля отвечает на вопрос
  // «брать ли», а подробности нужны, только когда мастер сомневается.
  const reviews = ref<Array<SessionReview>>([]);
  const areReviewsOpen = ref(false);
  const areReviewsLoading = ref(false);

  /** Показывает отзывы мастеров об игроке, подгружая их при первом открытии. */
  async function toggleReviews(): Promise<void> {
    areReviewsOpen.value = !areReviewsOpen.value;

    if (!areReviewsOpen.value || reviews.value.length) {
      return;
    }

    areReviewsLoading.value = true;

    try {
      reviews.value = await fetchPlayerReviews(gameId, registration.playerId);
    } catch {
      // Отзывов может не быть вовсе, а отклонённую заявку сервис к ним не
      // пускает: и то и другое показывается пустым списком.
      reviews.value = [];
    } finally {
      areReviewsLoading.value = false;
    }
  }

  /**
   * Что показать вместо отзыва, поставленного молча.
   * @param recommended Сыграл бы снова.
   */
  function getVerdictLabel(recommended: boolean): string {
    return recommended ? REVIEW_UP_LABEL : REVIEW_DOWN_LABEL;
  }
</script>

<template>
  <div class="flex flex-col gap-2 rounded-md border border-default p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="flex min-w-0 flex-col">
        <span class="font-medium text-highlighted">{{ playerName }}</span>

        <span
          v-if="registration.characterName"
          class="text-sm text-muted"
        >
          {{ registration.characterName }}
        </span>
      </span>

      <div class="flex flex-wrap items-center gap-1.5">
        <!-- Доля «сыграл бы снова» стоит рядом с решением: мастер принимает
          заявку, глядя на неё, а не на отдельной странице -->
        <UBadge
          :color="reputation && reputation.total > 0 ? 'success' : 'neutral'"
          variant="subtle"
          size="sm"
          icon="tabler:thumb-up"
          :label="reputationLabel"
        />

        <UBadge
          :color="statusColor"
          variant="subtle"
          size="sm"
          :label="SESSION_REGISTRATION_STATUS_LABELS[registration.status]"
        />

        <!-- Отмеченного игрока потом легко позвать в следующую игру -->
        <UTooltip :text="BOOKMARK_PLAYER_HINT">
          <UButton
            size="sm"
            variant="ghost"
            :color="isBookmarked ? 'primary' : 'neutral'"
            :icon="isBookmarked ? 'tabler:star-filled' : 'tabler:star'"
            :loading="busyUserId === registration.playerId"
            :aria-label="
              isBookmarked
                ? BOOKMARK_PLAYER_ACTIVE_LABEL
                : BOOKMARK_PLAYER_LABEL
            "
            @click.left.exact.prevent="togglePlayer(registration.playerId)"
          />
        </UTooltip>
      </div>
    </div>

    <UButton
      size="sm"
      variant="link"
      color="neutral"
      class="self-start p-0"
      :icon="areReviewsOpen ? 'tabler:chevron-up' : 'tabler:chevron-down'"
      :loading="areReviewsLoading"
      :label="PLAYER_REVIEWS_OPEN_LABEL"
      @click.left.exact.prevent="toggleReviews"
    />

    <div
      v-if="areReviewsOpen && !areReviewsLoading"
      class="flex flex-col gap-1.5"
    >
      <p
        v-if="!reviews.length"
        class="text-sm text-muted"
      >
        {{ REVIEWS_EMPTY_TITLE }}
      </p>

      <!-- Авторы не подписаны: отзыв об игроке пишут мастера, и подпись
        превратила бы его в счёты между ними -->
      <template v-else>
        <div
          v-for="review in reviews"
          :key="review.id"
          class="flex items-start gap-2 rounded-md bg-elevated p-2"
        >
          <UIcon
            :name="review.recommended ? 'tabler:thumb-up' : 'tabler:thumb-down'"
            class="mt-0.5 size-4 shrink-0"
            :class="review.recommended ? 'text-success' : 'text-error'"
          />

          <span class="text-sm wrap-break-word text-toned">
            {{ review.comment || getVerdictLabel(review.recommended) }}
          </span>
        </div>
      </template>
    </div>

    <UButton
      v-if="sheetToken"
      size="sm"
      variant="link"
      color="primary"
      icon="tabler:file-text"
      class="self-start p-0"
      :label="REGISTRATION_CHARACTER_SHEET_LABEL"
      @click.left.exact.prevent="openCharacterSheet"
    />

    <ULink
      v-else-if="registration.characterSheetUrl"
      :to="registration.characterSheetUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-1.5 text-sm text-primary"
    >
      <UIcon
        name="tabler:file-text"
        class="size-4"
      />
      {{ REGISTRATION_CHARACTER_SHEET_LABEL }}
    </ULink>

    <p
      v-if="isApproveBlocked"
      class="text-sm text-warning"
    >
      {{ REGISTRATIONS_FULL_HINT }}
    </p>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="isPending"
        size="sm"
        color="success"
        icon="tabler:check"
        :disabled="busy || isApproveBlocked"
        :label="REGISTRATION_APPROVE_LABEL"
        @click.left.exact.prevent="emit('approve', registration.id)"
      />

      <UButton
        v-if="isPending"
        size="sm"
        color="error"
        variant="subtle"
        icon="tabler:x"
        :disabled="busy"
        :label="REGISTRATION_REJECT_LABEL"
        @click.left.exact.prevent="emit('reject', registration.id)"
      />

      <UButton
        v-else-if="isApproved"
        size="sm"
        color="error"
        variant="subtle"
        icon="tabler:user-minus"
        :disabled="busy"
        :label="REGISTRATION_EXCLUDE_LABEL"
        :title="REGISTRATION_EXCLUDE_HINT"
        @click.left.exact.prevent="emit('reject', registration.id)"
      />
    </div>
  </div>
</template>
