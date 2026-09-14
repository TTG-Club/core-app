<script setup lang="ts">
  import type { SessionReview } from '../model';

  import { UiDrawer } from '~ui/drawer';
  import { UiResult } from '~ui/result';
  import { UserAvatar } from '~ui/user-avatar';

  import { useFollows } from '../composables';
  import {
    fetchMasterProfile,
    fetchMasterReviews,
    FOLLOW_MASTER_ACTIVE_LABEL,
    FOLLOW_MASTER_HINT,
    FOLLOW_MASTER_LABEL,
    getFindGameErrorMessage,
    getReputationLabel,
    getReviewVerdictIcon,
    getReviewVerdictTextClass,
    MASTER_PROFILE_ABOUT_EMPTY,
    MASTER_PROFILE_ABOUT_TITLE,
    MASTER_PROFILE_CANCELLED_LABEL,
    MASTER_PROFILE_CLOSED_LABEL,
    MASTER_PROFILE_ERROR_TITLE,
    MASTER_PROFILE_EXPERIENCE_LABEL,
    MASTER_PROFILE_RECRUITING_LABEL,
    MASTER_PROFILE_REVIEW_DATE_FORMAT,
    MASTER_PROFILE_REVIEW_VERDICT_LABELS,
    MASTER_PROFILE_REVIEWS_TITLE,
    MASTER_PROFILE_SESSIONS_LABEL,
    MASTER_PROFILE_TITLE,
    REVIEWS_EMPTY_DESCRIPTION,
    REVIEWS_EMPTY_TITLE,
  } from '../model';

  /** Строка отзыва, уже подготовленная к показу. */
  interface ReviewEntry {
    id: string;
    icon: string;
    iconClass: string;
    dateLabel: string;
    /** Текст отзыва, а без него — словесный вердикт. */
    text: string;
    /** Словесный вердикт тише текста отзыва. */
    textClass: string;
  }

  /**
   * Мастер глазами того, кто выбирает игру.
   *
   * Открывается по имени мастера в объявлении: перед заявкой игрок хочет
   * понять, с кем садится за стол — сколько игр у мастера за плечами, что о
   * нём говорят игроки и что он написал о себе. Поэтому сверху имя с
   * репутацией, под ним цифры, дальше — текст и отзывы.
   */
  const { masterId, masterName } = defineProps<{
    masterId: string;
    /** Имя из core-api: сервис поиска игр знает только идентификатор. */
    masterName: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const {
    data: profile,
    error,
    status,
  } = useAsyncData(
    () => `find-game-master-${masterId}`,
    () => fetchMasterProfile(masterId),
    { watch: [() => masterId], server: false, deep: false },
  );

  // Отзывы грузятся отдельным запросом: профиль со счётчиками нужен сразу, а
  // тексты — только тому, кто дочитал до них.
  const { data: reviews } = useAsyncData(
    () => `find-game-master-reviews-${masterId}`,
    () => fetchMasterReviews(masterId),
    { watch: [() => masterId], server: false, deep: false, default: () => [] },
  );

  const { format } = useDayjs();

  const { busyUserId, isMasterFollowed, toggleMaster } = useFollows();

  const isFollowed = computed(() => isMasterFollowed(masterId));

  // Отметка — переключатель, и выглядит так же, как нажатая «Мои игры»:
  // это единственный признак того, что отметка уже стоит.
  const followButtonIcon = computed(() =>
    isFollowed.value ? 'tabler:bookmark-filled' : 'tabler:bookmark',
  );

  const followButtonLabel = computed(() =>
    isFollowed.value ? FOLLOW_MASTER_ACTIVE_LABEL : FOLLOW_MASTER_LABEL,
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const hasReviews = computed(() => (profile.value?.reviews ?? 0) > 0);

  /**
   * Репутация мастера: доля тех, кто сыграл бы с ним снова. Доля, а не средний
   * балл: оценка бинарная, и «11 из 12» читается точнее числа с запятой.
   */
  const reputationLabel = computed(() => {
    const loaded = profile.value;

    return getReputationLabel(
      loaded
        ? {
            userId: loaded.userId,
            recommended: loaded.recommended,
            total: loaded.reviews,
          }
        : null,
    );
  });

  /** Мастер без единого отзыва отмечен спокойным цветом, а не «зелёным». */
  const reputationClass = computed(() =>
    hasReviews.value ? 'text-success' : 'text-muted',
  );

  /**
   * Счётчики игр мастера одной полосой. Первыми — проведённые встречи: по ним
   * видно, водит ли мастер на деле; отменённые приглушены — это не заслуга,
   * но и скрывать их нельзя.
   */
  const counters = computed(() => {
    const loaded = profile.value;

    if (!loaded) {
      return [];
    }

    return [
      {
        key: 'sessions',
        label: MASTER_PROFILE_SESSIONS_LABEL,
        value: loaded.completedSessions,
        valueClass: 'text-highlighted',
      },
      {
        key: 'recruiting',
        label: MASTER_PROFILE_RECRUITING_LABEL,
        value: loaded.recruitingGames,
        valueClass: 'text-highlighted',
      },
      {
        key: 'closed',
        label: MASTER_PROFILE_CLOSED_LABEL,
        value: loaded.closedGames,
        valueClass: 'text-highlighted',
      },
      {
        key: 'cancelled',
        label: MASTER_PROFILE_CANCELLED_LABEL,
        value: loaded.cancelledGames,
        valueClass: 'text-muted',
      },
    ];
  });

  const experienceLabel = computed(() => {
    const years = profile.value?.tabletopExperienceYears;

    return years === null || years === undefined
      ? ''
      : `${MASTER_PROFILE_EXPERIENCE_LABEL} ${years} ${getPlural(years, ['год', 'года', 'лет'])}`;
  });

  /**
   * Готовит отзыв к показу. Отзыв без текста не пустеет: вместо текста стоит
   * словесный вердикт, иначе строка держалась бы на одном значке.
   * @param review Отзыв игрока.
   */
  function toReviewEntry(review: SessionReview): ReviewEntry {
    const verdictLabel = review.recommended
      ? MASTER_PROFILE_REVIEW_VERDICT_LABELS.positive
      : MASTER_PROFILE_REVIEW_VERDICT_LABELS.negative;

    return {
      id: review.id,
      icon: getReviewVerdictIcon(review.recommended),
      iconClass: getReviewVerdictTextClass(review.recommended),
      dateLabel: format(review.createdAt, MASTER_PROFILE_REVIEW_DATE_FORMAT),
      text: review.comment || verdictLabel,
      textClass: review.comment ? 'text-toned' : 'text-sm text-muted',
    };
  }

  const reviewEntries = computed(() =>
    (reviews.value ?? []).map(toReviewEntry),
  );

  const reviewsCountLabel = computed(() => String(reviewEntries.value.length));
</script>

<template>
  <UiDrawer
    :title="MASTER_PROFILE_TITLE"
    class="w-lg"
    @close="emit('close')"
  >
    <div class="flex flex-col gap-6">
      <!-- Кто это: имя, стаж и репутация. Отметка стоит рядом с именем, а не
        над всем профилем: сначала человек, потом действие с ним -->
      <section class="flex items-start gap-4">
        <UserAvatar
          :user-id="masterId"
          :name="masterName"
          size="3xl"
          class="shrink-0 bg-primary/10 text-primary"
        />

        <div class="flex min-w-0 flex-auto flex-col gap-1">
          <h2
            class="text-xl/tight font-semibold wrap-break-word text-highlighted"
          >
            {{ masterName }}
          </h2>

          <USkeleton
            v-if="isLoading"
            class="h-4 w-32"
          />

          <template v-else-if="profile">
            <span
              v-if="experienceLabel"
              class="flex items-center gap-1.5 text-sm text-muted"
            >
              <UIcon
                name="tabler:hourglass"
                class="size-4 shrink-0"
              />

              {{ experienceLabel }}
            </span>

            <span
              class="flex items-center gap-1.5 text-sm"
              :class="reputationClass"
            >
              <UIcon
                name="tabler:thumb-up"
                class="size-4 shrink-0"
              />

              {{ reputationLabel }}
            </span>

            <UProgress
              v-if="hasReviews"
              :model-value="profile.recommended"
              :max="profile.reviews"
              color="success"
              size="xs"
              class="mt-1 max-w-48"
            />
          </template>

          <UTooltip :text="FOLLOW_MASTER_HINT">
            <UButton
              class="mt-2 self-start"
              size="sm"
              color="neutral"
              variant="subtle"
              active-color="primary"
              active-variant="subtle"
              :active="isFollowed"
              :icon="followButtonIcon"
              :loading="busyUserId === masterId"
              :label="followButtonLabel"
              :aria-pressed="isFollowed"
              @click.left.exact.prevent="toggleMaster(masterId)"
            />
          </UTooltip>
        </div>
      </section>

      <div
        v-if="isLoading"
        class="flex flex-col gap-3"
      >
        <USkeleton class="h-18 w-full rounded-xl" />

        <USkeleton class="h-24 w-full rounded-xl" />
      </div>

      <UiResult
        v-else-if="status === 'error'"
        status="error"
        :title="MASTER_PROFILE_ERROR_TITLE"
        :sub-title="getFindGameErrorMessage(error)"
      />

      <template v-else>
        <!-- Цифры берутся из самих игр: по ним видно, водит ли мастер или
          объявления копятся без исхода -->
        <dl
          class="grid grid-cols-2 divide-default overflow-hidden rounded-xl border border-default bg-elevated sm:grid-cols-4 sm:divide-x"
        >
          <div
            v-for="counter in counters"
            :key="counter.key"
            class="flex flex-col-reverse items-center justify-end gap-1 px-2 py-3 text-center"
          >
            <dt class="text-xs/tight text-balance text-muted">
              {{ counter.label }}
            </dt>

            <dd
              class="text-2xl/none font-semibold tabular-nums"
              :class="counter.valueClass"
            >
              {{ counter.value }}
            </dd>
          </div>
        </dl>

        <section class="flex flex-col gap-2">
          <h3 class="font-semibold text-highlighted">
            {{ MASTER_PROFILE_ABOUT_TITLE }}
          </h3>

          <p
            v-if="profile?.about"
            class="leading-snug wrap-break-word whitespace-pre-line text-toned"
          >
            {{ profile.about }}
          </p>

          <p
            v-else
            class="text-sm text-muted"
          >
            {{ MASTER_PROFILE_ABOUT_EMPTY }}
          </p>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="flex items-center gap-2 font-semibold text-highlighted">
            {{ MASTER_PROFILE_REVIEWS_TITLE }}

            <UBadge
              v-if="reviewEntries.length"
              color="neutral"
              variant="subtle"
              size="sm"
              :label="reviewsCountLabel"
            />
          </h3>

          <!-- Пустой список — тихая строка, а не заглушка на пол-экрана:
            отзывов нет у большинства новых мастеров, и это не ошибка -->
          <div
            v-if="!reviewEntries.length"
            class="flex items-start gap-3 rounded-xl border border-dashed border-default p-3"
          >
            <UIcon
              name="tabler:message-circle"
              class="mt-0.5 size-5 shrink-0 text-muted"
            />

            <div class="flex flex-col">
              <span class="text-sm font-medium text-toned">
                {{ REVIEWS_EMPTY_TITLE }}
              </span>

              <span class="text-sm text-muted">
                {{ REVIEWS_EMPTY_DESCRIPTION }}
              </span>
            </div>
          </div>

          <!-- Авторов не показываем: отзыв о мастере пишут игроки его же
            игр, и подпись превратила бы оценку в разговор с ним лично -->
          <ul
            v-else
            class="flex flex-col divide-y divide-default overflow-hidden rounded-xl border border-default bg-elevated"
          >
            <li
              v-for="review in reviewEntries"
              :key="review.id"
              class="flex items-start gap-3 p-3"
            >
              <UIcon
                :name="review.icon"
                class="mt-0.5 size-5 shrink-0"
                :class="review.iconClass"
              />

              <div class="flex min-w-0 flex-col gap-1">
                <p
                  class="leading-snug wrap-break-word"
                  :class="review.textClass"
                >
                  {{ review.text }}
                </p>

                <span class="text-xs text-muted">
                  {{ review.dateLabel }}
                </span>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </UiDrawer>
</template>
