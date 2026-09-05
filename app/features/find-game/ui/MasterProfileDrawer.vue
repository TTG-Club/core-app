<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { UiResult } from '~ui/result';

  import { useFollows } from '../composables';
  import {
    fetchMasterProfile,
    fetchMasterReviews,
    FOLLOW_MASTER_ACTIVE_LABEL,
    FOLLOW_MASTER_HINT,
    FOLLOW_MASTER_LABEL,
    getFindGameErrorMessage,
    getReputationLabel,
    MASTER_PROFILE_ABOUT_EMPTY,
    MASTER_PROFILE_CANCELLED_LABEL,
    MASTER_PROFILE_CLOSED_LABEL,
    MASTER_PROFILE_ERROR_TITLE,
    MASTER_PROFILE_EXPERIENCE_LABEL,
    MASTER_PROFILE_RECRUITING_LABEL,
    MASTER_PROFILE_REVIEWS_TITLE,
    MASTER_PROFILE_SESSIONS_LABEL,
    MASTER_PROFILE_TITLE,
    REVIEWS_EMPTY_DESCRIPTION,
    REVIEWS_EMPTY_TITLE,
    SESSION_DATE_FORMAT,
  } from '../model';

  /**
   * Мастер глазами того, кто выбирает игру.
   *
   * Открывается по имени мастера в объявлении: перед заявкой игрок хочет
   * понять, с кем садится за стол — что мастер о себе написал и сколько игр у
   * него за плечами.
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

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

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

  /** Счётчики игр мастера — то, что видно по его прошлым объявлениям. */
  const counters = computed(() => {
    const loaded = profile.value;

    if (!loaded) {
      return [];
    }

    return [
      {
        key: 'recruiting',
        label: MASTER_PROFILE_RECRUITING_LABEL,
        value: loaded.recruitingGames,
        icon: 'tabler:user-plus',
      },
      {
        key: 'closed',
        label: MASTER_PROFILE_CLOSED_LABEL,
        value: loaded.closedGames,
        icon: 'tabler:flag-check',
      },
      {
        key: 'cancelled',
        label: MASTER_PROFILE_CANCELLED_LABEL,
        value: loaded.cancelledGames,
        icon: 'tabler:calendar-x',
      },
      {
        key: 'sessions',
        label: MASTER_PROFILE_SESSIONS_LABEL,
        value: loaded.completedSessions,
        icon: 'tabler:dice',
      },
    ];
  });

  const experienceLabel = computed(() => {
    const years = profile.value?.tabletopExperienceYears;

    return years === null || years === undefined
      ? ''
      : `${years} ${getPlural(years, ['год', 'года', 'лет'])}`;
  });
</script>

<template>
  <UiDrawer
    :title="MASTER_PROFILE_TITLE"
    class="w-lg"
    @close="emit('close')"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <UAvatar
          :alt="masterName"
          size="lg"
          class="shrink-0 bg-elevated"
        />

        <div class="flex min-w-0 flex-col">
          <span class="truncate text-lg font-semibold text-highlighted">
            {{ masterName }}
          </span>

          <span
            v-if="experienceLabel"
            class="text-sm text-muted"
          >
            {{ MASTER_PROFILE_EXPERIENCE_LABEL }}: {{ experienceLabel }}
          </span>

          <UBadge
            v-if="profile"
            :color="profile.reviews > 0 ? 'success' : 'neutral'"
            variant="subtle"
            size="sm"
            icon="tabler:thumb-up"
            class="mt-1 self-start"
            :label="reputationLabel"
          />
        </div>
      </div>

      <!-- Отметка односторонняя и мастера ни о чём не спрашивает: это
        закладка в своём списке, чтобы не пропустить его новую игру -->
      <UTooltip :text="FOLLOW_MASTER_HINT">
        <UButton
          block
          :color="isFollowed ? 'primary' : 'neutral'"
          :variant="isFollowed ? 'solid' : 'subtle'"
          :icon="isFollowed ? 'tabler:bookmark-filled' : 'tabler:bookmark'"
          :loading="busyUserId === masterId"
          :label="isFollowed ? FOLLOW_MASTER_ACTIVE_LABEL : FOLLOW_MASTER_LABEL"
          @click.left.exact.prevent="toggleMaster(masterId)"
        />
      </UTooltip>

      <div
        v-if="isLoading"
        class="flex flex-col gap-2"
      >
        <USkeleton class="h-16 w-full rounded-lg" />

        <USkeleton class="h-20 w-full rounded-lg" />
      </div>

      <UiResult
        v-else-if="status === 'error'"
        status="error"
        :title="MASTER_PROFILE_ERROR_TITLE"
        :sub-title="getFindGameErrorMessage(error)"
      />

      <template v-else>
        <p class="leading-snug wrap-break-word text-toned">
          {{ profile?.about || MASTER_PROFILE_ABOUT_EMPTY }}
        </p>

        <!-- Счётчики берутся из самих игр: по ним видно, водит ли мастер или
          объявления копятся без исхода -->
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="counter in counters"
            :key="counter.key"
            class="flex items-center gap-2 rounded-lg border border-default p-3"
          >
            <UIcon
              :name="counter.icon"
              class="size-5 shrink-0 text-muted"
            />

            <div class="flex min-w-0 flex-col">
              <span class="text-lg font-semibold text-highlighted tabular-nums">
                {{ counter.value }}
              </span>

              <span class="truncate text-xs text-muted">
                {{ counter.label }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="font-semibold text-highlighted">
            {{ MASTER_PROFILE_REVIEWS_TITLE }}
          </h3>

          <UiResult
            v-if="!reviews?.length"
            status="info"
            :title="REVIEWS_EMPTY_TITLE"
            :sub-title="REVIEWS_EMPTY_DESCRIPTION"
          />

          <!-- Авторов не показываем: отзыв о мастере пишут игроки его же
            игр, и подпись превратила бы оценку в разговор с ним лично -->
          <template v-else>
            <div
              v-for="review in reviews"
              :key="review.id"
              class="flex flex-col gap-1 rounded-lg border border-default p-3"
            >
              <div class="flex items-center justify-between gap-2">
                <UIcon
                  :name="
                    review.recommended ? 'tabler:thumb-up' : 'tabler:thumb-down'
                  "
                  class="size-5 shrink-0"
                  :class="review.recommended ? 'text-success' : 'text-error'"
                />

                <span class="text-xs text-muted">
                  {{ format(review.createdAt, SESSION_DATE_FORMAT) }}
                </span>
              </div>

              <p
                v-if="review.comment"
                class="leading-snug wrap-break-word text-toned"
              >
                {{ review.comment }}
              </p>
            </div>
          </template>
        </div>
      </template>
    </div>
  </UiDrawer>
</template>
