<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { UiResult } from '~ui/result';
  import { UserAvatar } from '~ui/user-avatar';

  import {
    fetchPlayerProfile,
    getFindGameErrorMessage,
    getTabletopExperienceLabel,
    PLAYER_PROFILE_ABOUT_EMPTY,
    PLAYER_PROFILE_ABOUT_TITLE,
    PLAYER_PROFILE_ERROR_TITLE,
    PLAYER_PROFILE_REVIEWS_HINT,
    PLAYER_PROFILE_SESSIONS_LABEL,
    PLAYER_PROFILE_TITLE,
  } from '../model';

  /**
   * Игрок глазами тех, с кем он сидит за одним столом.
   *
   * Открывается по имени в составе игры: и мастеру, и соседям по столу нужно
   * понять, кого они зовут, — часто ли он играет и что о себе написал. Оценок
   * здесь нет: отзывы об игроках мастер читает через заявку в свою игру, и
   * показывать их соседям по составу было бы разговором за спиной.
   */
  const { playerId, playerName } = defineProps<{
    playerId: string;
    /** Имя из core-api: сервис поиска игр знает только идентификатор. */
    playerName: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const {
    data: profile,
    error,
    status,
  } = useAsyncData(
    () => `find-game-player-${playerId}`,
    () => fetchPlayerProfile(playerId),
    { watch: [() => playerId], server: false, deep: false },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const experienceLabel = computed(() =>
    getTabletopExperienceLabel(profile.value?.tabletopExperienceYears ?? null),
  );
</script>

<template>
  <UiDrawer
    :title="PLAYER_PROFILE_TITLE"
    class="w-lg"
    @close="emit('close')"
  >
    <div class="flex flex-col gap-6">
      <!-- Кто это: имя и стаж. Счётчик встреч идёт отдельной полосой ниже —
        в строке под именем он потерялся бы между стажем и рассказом -->
      <section class="flex items-start gap-4">
        <UserAvatar
          :user-id="playerId"
          :name="playerName"
          size="3xl"
          class="shrink-0 bg-primary/10 text-primary"
        />

        <div class="flex min-w-0 flex-auto flex-col gap-1">
          <h2
            class="text-xl/tight font-semibold wrap-break-word text-highlighted"
          >
            {{ playerName }}
          </h2>

          <USkeleton
            v-if="isLoading"
            class="h-4 w-32"
          />

          <span
            v-else-if="experienceLabel"
            class="flex items-center gap-1.5 text-sm text-muted"
          >
            <UIcon
              name="tabler:hourglass"
              class="size-4 shrink-0"
            />

            {{ experienceLabel }}
          </span>
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
        :title="PLAYER_PROFILE_ERROR_TITLE"
        :sub-title="getFindGameErrorMessage(error)"
      />

      <template v-else>
        <!-- Счётчик берётся из самих встреч: по нему видно, играет ли человек
          на деле или только подаёт заявки -->
        <dl
          class="flex flex-col-reverse items-center justify-end gap-1 overflow-hidden rounded-xl border border-default bg-elevated px-2 py-3 text-center"
        >
          <dt class="text-xs/tight text-balance text-muted">
            {{ PLAYER_PROFILE_SESSIONS_LABEL }}
          </dt>

          <dd class="text-2xl/none font-semibold text-highlighted tabular-nums">
            {{ profile?.playedSessions ?? 0 }}
          </dd>
        </dl>

        <section class="flex flex-col gap-2">
          <h3 class="font-semibold text-highlighted">
            {{ PLAYER_PROFILE_ABOUT_TITLE }}
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
            {{ PLAYER_PROFILE_ABOUT_EMPTY }}
          </p>
        </section>

        <!-- Почему здесь нет оценок: без этой строки их отсутствие читалось
          бы как «игрока никто не оценивал» -->
        <p class="flex items-start gap-2 text-sm text-muted">
          <UIcon
            name="tabler:info-circle"
            class="mt-0.5 size-4 shrink-0"
          />

          {{ PLAYER_PROFILE_REVIEWS_HINT }}
        </p>
      </template>
    </div>
  </UiDrawer>
</template>
