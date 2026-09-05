<script setup lang="ts">
  import type { TimelineItem } from '@nuxt/ui';
  import type { ManipulateType } from 'dayjs';

  import type {
    Game,
    GameSession,
    GameViewerAbilities,
    SessionAttendanceStatus,
    SessionParticipant,
    SessionTimelineScale,
  } from '../../model';

  import { UiResult } from '~ui/result';

  import {
    findNearestMoment,
    GAME_SESSION_STATUS_ICONS,
    GAME_SESSION_STATUS_TIMELINE_CLASSES,
    SESSION_DETAIL_TITLE,
    SESSION_TIMELINE_DATE_FORMATS,
    SESSION_TIMELINE_EMPTY_DESCRIPTION,
    SESSION_TIMELINE_EMPTY_TITLE,
    SESSION_TIMELINE_NEAREST_BADGE,
    SESSION_TIMELINE_NEAREST_CLASSES,
    SESSION_TIMELINE_NEAREST_LABEL,
    SESSION_TIMELINE_NEXT_LABEL,
    SESSION_TIMELINE_NOW_BADGE,
    SESSION_TIMELINE_OUTSIDE_PREFIX,
    SESSION_TIMELINE_PREV_LABEL,
    SESSION_TIMELINE_SCALE_LABEL,
    SESSION_TIMELINE_SCALE_LABELS,
    SESSION_TIMELINE_SCALES,
    SESSION_TIMELINE_TODAY_LABEL,
    SESSION_TIMELINE_WINDOW_FORMATS,
  } from '../../model';
  import SessionCard from './SessionCard.vue';

  /**
   * Точка оси вместе с самой сессией: раскрытая карточка берёт её отсюда, а
   * не ищет заново по идентификатору.
   */
  interface SessionTimelineItem extends TimelineItem {
    session: GameSession;
    /** Текущая точка игры: идущая встреча или ближайшая предстоящая. */
    current: boolean;
    /** Подпись этой точки: идущая говорит «сейчас», будущая — «ближайшая». */
    currentLabel: string;
  }

  /**
   * Расписание сессий по горизонтальной оси времени.
   *
   * Встречи идут слева направо, прошедшие отмечены пройденными, ближайшая —
   * текущей; так видно, где игра находится прямо сейчас. Масштаб выбирает
   * показанный период, как в календаре: день, неделя, месяц или год.
   */
  const scale = defineModel<SessionTimelineScale>('scale', { required: true });

  const {
    sessions,
    game,
    abilities,
    participationBySession,
    busy = false,
  } = defineProps<{
    /** Сессии, прошедшие фильтр по состоянию. */
    sessions: ReadonlyArray<GameSession>;
    game: Game;
    abilities: GameViewerAbilities;
    /** Собственное участие пользователя по сессиям. */
    participationBySession: ReadonlyMap<string, SessionParticipant>;
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

  const { $dayjs, format } = useDayjs();

  /** Масштаб — он же единица периода: период всегда ровно один такой отрезок. */
  const SCALE_UNITS: Record<SessionTimelineScale, ManipulateType> = {
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
  };

  const scaleOptions = SESSION_TIMELINE_SCALES.map((value) => ({
    value,
    label: SESSION_TIMELINE_SCALE_LABELS[value],
  }));

  // Пока период не листали, он показывает ближайшую сессию, а не «сегодня»:
  // у кампании раз в две недели сегодня чаще всего пусто.
  const anchor = ref<number | null>(null);

  /** Открытая карточка встречи; `null` — дровер закрыт. */
  const detailSession = ref<GameSession | null>(null);

  const isDetailOpen = computed({
    get: () => !!detailSession.value,
    set: (opened: boolean) => {
      if (!opened) {
        detailSession.value = null;
      }
    },
  });

  const datedSessions = computed(() =>
    sessions
      .filter((session) => !!session.startsAt)
      .map((session) => ({ session, at: $dayjs(session.startsAt).valueOf() }))
      .sort((left, right) => left.at - right.at),
  );

  const nearestAt = computed(() =>
    findNearestMoment(
      datedSessions.value.map((entry) => entry.at),
      $dayjs().valueOf(),
    ),
  );

  /**
   * Текущая точка игры: идущая встреча, а если такой нет — ближайшая
   * предстоящая.
   *
   * Идущая важнее будущей: пока за столом играют, «ближайшая» — это она, а не
   * следующая по расписанию. Просроченные встречи, которые мастер забыл
   * закрыть, точкой не становятся — иначе отметка застряла бы в прошлом.
   */
  const currentSessionId = computed(() => {
    const now = $dayjs().valueOf();

    const inProgress = datedSessions.value.find(
      (entry) => entry.session.status === 'IN_PROGRESS',
    );

    if (inProgress) {
      return inProgress.session.id;
    }

    const upcoming = datedSessions.value.filter(
      (entry) => entry.session.status === 'SCHEDULED' && entry.at >= now,
    );

    const at = findNearestMoment(
      upcoming.map((entry) => entry.at),
      now,
    );

    return upcoming.find((entry) => entry.at === at)?.session.id ?? null;
  });

  const windowStart = computed(() =>
    $dayjs(anchor.value ?? nearestAt.value ?? $dayjs().valueOf()).startOf(
      SCALE_UNITS[scale.value],
    ),
  );

  const windowEnd = computed(() =>
    windowStart.value.add(1, SCALE_UNITS[scale.value]),
  );

  const windowLabel = computed(() => {
    if (scale.value !== 'WEEK') {
      return windowStart.value.format(
        SESSION_TIMELINE_WINDOW_FORMATS[scale.value],
      );
    }

    // Неделя переходит из месяца в месяц, поэтому подпись — это диапазон.
    return `${windowStart.value.format('D MMM')} — ${windowEnd.value
      .subtract(1, 'day')
      .format('D MMM YYYY')}`;
  });

  const visibleEntries = computed(() =>
    datedSessions.value.filter(
      (entry) =>
        entry.at >= windowStart.value.valueOf()
        && entry.at < windowEnd.value.valueOf(),
    ),
  );

  const outsideCount = computed(
    () => datedSessions.value.length - visibleEntries.value.length,
  );

  const items = computed<Array<SessionTimelineItem>>(() =>
    visibleEntries.value.map(({ session }) => {
      const current = session.id === currentSessionId.value;
      const indicator = GAME_SESSION_STATUS_TIMELINE_CLASSES[session.status];

      return {
        value: session.id,
        date: format(
          session.startsAt,
          SESSION_TIMELINE_DATE_FORMATS[scale.value],
        ),
        title: session.title,
        icon: GAME_SESSION_STATUS_ICONS[session.status],
        ui: {
          indicator: current
            ? `${indicator} ${SESSION_TIMELINE_NEAREST_CLASSES}`
            : indicator,
        },
        session,
        current,
        currentLabel:
          session.status === 'IN_PROGRESS'
            ? SESSION_TIMELINE_NOW_BADGE
            : SESSION_TIMELINE_NEAREST_BADGE,
      };
    }),
  );

  const isEmptyWindow = computed(() => visibleEntries.value.length === 0);

  const canJumpToNearest = computed(
    () => nearestAt.value !== null && outsideCount.value > 0,
  );

  /**
   * Листает период вперёд или назад.
   * @param direction Направление: `1` — вперёд, `-1` — назад.
   */
  function shiftWindow(direction: number): void {
    anchor.value = windowStart.value
      .add(direction, SCALE_UNITS[scale.value])
      .valueOf();
  }

  /** Возвращает период к текущему моменту. */
  function goToday(): void {
    anchor.value = $dayjs().valueOf();
  }

  /** Переводит период к ближайшей сессии. */
  function goNearest(): void {
    if (nearestAt.value !== null) {
      anchor.value = nearestAt.value;
    }
  }

  /**
   * Собственное участие в сессии; `null` — пользователь не в составе.
   * @param sessionId Идентификатор сессии.
   */
  function participantOf(sessionId: string): SessionParticipant | null {
    return participationBySession.get(sessionId) ?? null;
  }

  /**
   * Раскрывает карточку встречи.
   * @param session Встреча с оси или из набора без даты.
   */
  function openDetail(session: GameSession): void {
    detailSession.value = session;
  }

  /**
   * Закрывает дровер и передаёт действие наверх: следом открывается своё окно
   * — состав, копия, подтверждение, — и держать под ним ещё одну панель незачем.
   * @param action Действие карточки.
   */
  function closeAnd(action: () => void): void {
    detailSession.value = null;
    action();
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          icon="tabler:chevron-left"
          :aria-label="SESSION_TIMELINE_PREV_LABEL"
          @click.left.exact.prevent="shiftWindow(-1)"
        />

        <span class="min-w-40 text-center font-medium text-highlighted">
          {{ windowLabel }}
        </span>

        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          icon="tabler:chevron-right"
          :aria-label="SESSION_TIMELINE_NEXT_LABEL"
          @click.left.exact.prevent="shiftWindow(1)"
        />

        <UButton
          size="sm"
          color="neutral"
          variant="subtle"
          :label="SESSION_TIMELINE_TODAY_LABEL"
          @click.left.exact.prevent="goToday"
        />
      </div>

      <UFieldGroup size="sm">
        <UButton
          v-for="option in scaleOptions"
          :key="option.value"
          :color="scale === option.value ? 'primary' : 'neutral'"
          :variant="scale === option.value ? 'solid' : 'subtle'"
          :aria-label="`${SESSION_TIMELINE_SCALE_LABEL}: ${option.label}`"
          :label="option.label"
          @click.left.exact.prevent="scale = option.value"
        />
      </UFieldGroup>
    </div>

    <UiResult
      v-if="isEmptyWindow"
      status="info"
      :title="SESSION_TIMELINE_EMPTY_TITLE"
      :sub-title="SESSION_TIMELINE_EMPTY_DESCRIPTION"
    />

    <!-- Ось шире экрана телефона: расписание прокручивают, а не сжимают до
      нечитаемого. Отступы держат ореол текущей встречи: прокрутка обрезает и
      по вертикали, а ореол выходит за круг метки -->
    <div
      v-else
      class="overflow-x-auto p-1.5"
    >
      <!-- Клик по метке открывает ту же карточку, что и клик по подписи:
        целиться в мелкий кружок и промахиваться мимо мастеру незачем -->
      <UTimeline
        :items="items"
        orientation="horizontal"
        size="sm"
        :ui="{ root: 'min-w-3xl', item: 'cursor-pointer' }"
        @select="(_event, item) => openDetail(item.session)"
      >
        <!-- На оси помещается только дата с названием: остальное показывает
          дровер. Подпись остаётся кнопкой ради клавиатуры -->
        <template #wrapper="{ item }">
          <button
            type="button"
            class="flex w-full flex-col rounded-md text-left transition hover:opacity-80"
            :title="item.current ? item.currentLabel : undefined"
            @click.left.exact.prevent="openDetail(item.session)"
          >
            <span class="text-xs/5 whitespace-nowrap text-dimmed">
              {{ item.date }}
            </span>

            <span
              class="text-sm font-medium"
              :class="item.current ? 'text-primary' : 'text-highlighted'"
            >
              {{ item.title }}
            </span>
          </button>
        </template>
      </UTimeline>
    </div>

    <div
      v-if="outsideCount > 0"
      class="flex flex-wrap items-center gap-2"
    >
      <UBadge
        color="neutral"
        variant="subtle"
        size="sm"
        icon="tabler:calendar-search"
        :label="`${SESSION_TIMELINE_OUTSIDE_PREFIX}: ${outsideCount}`"
      />

      <UButton
        v-if="canJumpToNearest"
        size="sm"
        color="neutral"
        variant="link"
        class="p-0"
        :label="SESSION_TIMELINE_NEAREST_LABEL"
        @click.left.exact.prevent="goNearest"
      />
    </div>

    <!-- Карточка живёт в дровере: поповер у точки оси упирался в край экрана,
      а у встречи бывает до полудюжины действий -->
    <USlideover
      v-model:open="isDetailOpen"
      :title="SESSION_DETAIL_TITLE"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <template #body>
        <SessionCard
          v-if="detailSession"
          class="rounded-none bg-transparent ring-0"
          :session="detailSession"
          :game="game"
          :abilities="abilities"
          :participant="participantOf(detailSession.id)"
          :busy="busy"
          @attend="(id, status) => emit('attend', id, status)"
          @copy="closeAnd(() => emit('copy', $event))"
          @open-participants="closeAnd(() => emit('open-participants', $event))"
          @schedule="closeAnd(() => emit('schedule', $event))"
          @complete="closeAnd(() => emit('complete', $event))"
          @start="closeAnd(() => emit('start', $event))"
          @cancel="closeAnd(() => emit('cancel', $event))"
          @review="closeAnd(() => emit('review', $event))"
        />
      </template>
    </USlideover>
  </div>
</template>
