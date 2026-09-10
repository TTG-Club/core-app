<script setup lang="ts">
  import type { GameReport } from '../../model';

  import {
    GAME_DELETE_LABEL,
    GAME_REPORT_AUTHOR_LABEL,
    GAME_REPORT_CREATED_LABEL,
    GAME_REPORT_DATE_FORMAT,
    GAME_REPORT_HIDDEN_BADGE,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_LABEL,
    GAME_REPORT_REASON_LABELS,
    getGameRoute,
  } from '../../model';

  /**
   * Жалоба на объявление в очереди модератора: что за игра, кто и почему
   * пожаловался, и два ответа на неё — скрыть игру или все игры мастера.
   */
  const {
    report,
    reporterName,
    busy = false,
  } = defineProps<{
    report: GameReport;
    /** Отображаемое имя автора жалобы; UUID пользователю показывать нельзя. */
    reporterName: string;
    /** Идёт модераторское действие: кнопки заблокированы. */
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    'hide-game': [reportId: string];
    'hide-master-games': [reportId: string];
  }>();

  const { format } = useDayjs();

  const gameRoute = computed(() => getGameRoute(report.gameId));

  const createdLabel = computed(() =>
    format(report.createdAt, GAME_REPORT_DATE_FORMAT),
  );
</script>

<template>
  <article
    class="flex flex-col gap-3 rounded-xl border border-default bg-elevated p-4"
  >
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <NuxtLink
          :to="gameRoute"
          class="font-semibold text-highlighted hover:text-primary"
        >
          {{ report.gameTitle }}
        </NuxtLink>

        <p class="mt-1 text-sm text-muted">
          {{ GAME_REPORT_AUTHOR_LABEL }}:
          {{ reporterName }}
        </p>
      </div>

      <UBadge
        color="error"
        variant="subtle"
        :label="GAME_REPORT_REASON_LABELS[report.reason]"
      />
    </div>

    <p
      v-if="report.details"
      class="text-sm whitespace-pre-line text-toned"
    >
      {{ report.details }}
    </p>

    <p class="text-xs text-muted">
      {{ GAME_REPORT_CREATED_LABEL }}:
      {{ createdLabel }}
    </p>

    <div class="flex flex-wrap gap-2">
      <UBadge
        v-if="report.gameDeleted"
        color="neutral"
        variant="subtle"
        :label="GAME_REPORT_HIDDEN_BADGE"
      />

      <UButton
        v-else
        size="sm"
        color="error"
        variant="soft"
        icon="tabler:eye-off"
        :disabled="busy"
        :label="GAME_DELETE_LABEL"
        @click.left.exact.prevent="emit('hide-game', report.id)"
      />

      <UButton
        size="sm"
        color="error"
        variant="outline"
        icon="tabler:ban"
        :disabled="busy"
        :label="GAME_REPORT_HIDE_ALL_MASTER_GAMES_LABEL"
        @click.left.exact.prevent="emit('hide-master-games', report.id)"
      />
    </div>
  </article>
</template>
