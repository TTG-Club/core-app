<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { UiResult } from '~ui/result';

  import {
    fetchMasterProfile,
    getFindGameErrorMessage,
    MASTER_PROFILE_ABOUT_EMPTY,
    MASTER_PROFILE_CANCELLED_LABEL,
    MASTER_PROFILE_CLOSED_LABEL,
    MASTER_PROFILE_ERROR_TITLE,
    MASTER_PROFILE_EXPERIENCE_LABEL,
    MASTER_PROFILE_RECRUITING_LABEL,
    MASTER_PROFILE_SESSIONS_LABEL,
    MASTER_PROFILE_TITLE,
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

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

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
        </div>
      </div>

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
      </template>
    </div>
  </UiDrawer>
</template>
