<script setup lang="ts">
  import type {
    Game,
    GameSession,
    GameViewerAbilities,
    SessionAttendanceStatus,
    SessionParticipant,
  } from '../../model';

  import {
    ATTENDANCE_TITLE,
    GAME_SESSION_STATUS_COLORS,
    GAME_SESSION_STATUS_LABELS,
    getSessionDurationLabel,
    getSessionPriceLabel,
    PAYMENT_PAID_LABEL,
    PAYMENT_UNPAID_LABEL,
    resolveSessionAbilities,
    REVIEW_OPEN_LABEL,
    SESSION_ATTENDANCE_STATUS_LABELS,
    SESSION_ATTENDANCE_STATUSES,
    SESSION_CANCEL_LABEL,
    SESSION_COMPLETE_LABEL,
    SESSION_COPY_LABEL,
    SESSION_DATE_FORMAT,
    SESSION_PARTICIPANTS_COUNT_LABEL,
    SESSION_PARTICIPANTS_LABEL,
    SESSION_START_LABEL,
  } from '../../model';

  const {
    session,
    game,
    abilities,
    participant = null,
    busy = false,
  } = defineProps<{
    session: GameSession;
    game: Game;
    abilities: GameViewerAbilities;
    /** Собственная заявка пользователя на эту сессию. */
    /** Собственное участие пользователя во встрече; `null` — не в составе. */
    participant?: SessionParticipant | null;
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    'attend': [sessionId: string, status: SessionAttendanceStatus];
    'copy': [session: GameSession];
    'open-participants': [sessionId: string];
    'cancel': [session: GameSession];
    'complete': [session: GameSession];
    'start': [session: GameSession];
    'schedule': [session: GameSession];
    'review': [session: GameSession];
  }>();

  const { format } = useDayjs();

  const sessionAbilities = computed(() =>
    resolveSessionAbilities(session, game, participant, abilities),
  );

  // Дата у сессии есть всегда: набор идёт в самой игре, а встреча
  // назначается на время. Пустая дата встречается только у записей, заведённых
  // до этого правила.
  const startsAtLabel = computed(() =>
    session.startsAt ? format(session.startsAt, SESSION_DATE_FORMAT) : '',
  );

  const durationLabel = computed(() =>
    getSessionDurationLabel(session.estimatedDurationMinutes),
  );

  const priceLabel = computed(() => getSessionPriceLabel(session));

  const playersLabel = computed(
    () =>
      `${SESSION_PARTICIPANTS_COUNT_LABEL}: ${sessionAbilities.value.participantCount} / ${game.maxPlayers}`,
  );

  const attendanceOptions = SESSION_ATTENDANCE_STATUSES.map((value) => ({
    value,
    label: SESSION_ATTENDANCE_STATUS_LABELS[value],
    icon: value === 'ATTENDING' ? 'tabler:check' : 'tabler:x',
  }));

  const statusColor = computed(
    () => GAME_SESSION_STATUS_COLORS[session.status],
  );

  const paymentLabel = computed(() =>
    participant?.paid ? PAYMENT_PAID_LABEL : PAYMENT_UNPAID_LABEL,
  );

  // Отметка оплаты имеет смысл только участнику платной игры.
  const showPaymentBadge = computed(
    () => game.costType === 'PAID' && !!participant,
  );

  /**
   * Меняет присутствие, если статус реально другой: сервис примет и повторный,
   * но лишний запрос ничего не даёт.
   * @param status Новый статус присутствия.
   */
  function changeAttendance(status: SessionAttendanceStatus): void {
    if (participant?.attendanceStatus === status) {
      return;
    }

    emit('attend', session.id, status);
  }
</script>

<template>
  <UCard :ui="{ body: 'flex flex-col gap-3 p-4' }">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="flex min-w-0 flex-col gap-1">
        <h4 class="font-semibold text-highlighted">
          {{ session.title }}
        </h4>

        <div
          class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"
        >
          <span class="flex items-center gap-1.5">
            <UIcon
              name="tabler:calendar-event"
              class="size-4"
            />
            {{ startsAtLabel }}
          </span>

          <span
            v-if="durationLabel"
            class="flex items-center gap-1.5"
          >
            <UIcon
              name="tabler:clock"
              class="size-4"
            />
            {{ durationLabel }}
          </span>

          <span
            v-if="priceLabel"
            class="flex items-center gap-1.5"
          >
            <UIcon
              name="tabler:coins"
              class="size-4"
            />
            {{ priceLabel }}
          </span>
        </div>
      </div>

      <UBadge
        :color="statusColor"
        variant="subtle"
        size="sm"
        :label="GAME_SESSION_STATUS_LABELS[session.status]"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UBadge
        color="neutral"
        variant="subtle"
        size="sm"
        icon="tabler:users"
        :label="playersLabel"
      />

      <UBadge
        v-if="showPaymentBadge"
        :color="participant?.paid ? 'success' : 'neutral'"
        variant="subtle"
        size="sm"
        icon="tabler:receipt"
        :label="paymentLabel"
      />
    </div>

    <div
      v-if="sessionAbilities.canChangeAttendance"
      class="flex flex-col gap-1.5"
    >
      <span class="text-sm text-muted">{{ ATTENDANCE_TITLE }}</span>

      <div class="flex gap-2">
        <UButton
          v-for="option in attendanceOptions"
          :key="option.value"
          size="sm"
          :icon="option.icon"
          :label="option.label"
          :color="
            participant?.attendanceStatus === option.value
              ? 'primary'
              : 'neutral'
          "
          :variant="
            participant?.attendanceStatus === option.value ? 'solid' : 'subtle'
          "
          :disabled="busy"
          @click.left.exact.prevent="changeAttendance(option.value)"
        />
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="abilities.canReviewRegistrations"
        size="sm"
        color="neutral"
        variant="subtle"
        icon="tabler:clipboard-list"
        :label="SESSION_PARTICIPANTS_LABEL"
        @click.left.exact.prevent="emit('open-participants', session.id)"
      />

      <UButton
        v-if="abilities.canCopySession"
        size="sm"
        color="neutral"
        variant="subtle"
        icon="tabler:copy"
        :label="SESSION_COPY_LABEL"
        @click.left.exact.prevent="emit('copy', session)"
      />

      <!-- Зелёная, как метка идущей встречи на оси: кнопка переводит сессию
        ровно в это состояние -->
      <UButton
        v-if="sessionAbilities.canStart"
        size="sm"
        color="success"
        variant="subtle"
        icon="tabler:player-play"
        :disabled="busy"
        :label="SESSION_START_LABEL"
        @click.left.exact.prevent="emit('start', session)"
      />

      <UButton
        v-if="sessionAbilities.canComplete"
        size="sm"
        color="neutral"
        variant="subtle"
        icon="tabler:flag-check"
        :disabled="busy"
        :label="SESSION_COMPLETE_LABEL"
        @click.left.exact.prevent="emit('complete', session)"
      />

      <!-- Оценки ставят по свежей памяти: кнопка живёт ровно столько,
        сколько открыто окно на оценку -->
      <UButton
        v-if="sessionAbilities.canReview"
        size="sm"
        color="primary"
        variant="subtle"
        icon="tabler:thumb-up"
        :label="REVIEW_OPEN_LABEL"
        @click.left.exact.prevent="emit('review', session)"
      />

      <UButton
        v-if="sessionAbilities.canCancel"
        size="sm"
        color="error"
        variant="subtle"
        icon="tabler:calendar-x"
        :disabled="busy"
        :label="SESSION_CANCEL_LABEL"
        @click.left.exact.prevent="emit('cancel', session)"
      />
    </div>
  </UCard>
</template>
