<script setup lang="ts">
  import type { BadgeProps } from '@nuxt/ui';

  import type { Game } from '../../model';

  import { useMasterProfileDrawer } from '../../composables';
  import {
    GAME_CHAT_LINK_LABEL,
    GAME_COST_TYPE_LABELS,
    GAME_CROSSPLAY_ALLOWED_VALUE,
    GAME_DURATION_TYPE_LABELS,
    GAME_FACT_LABELS,
    GAME_LINKS_TITLE,
    GAME_MASTER_CHAT_LINK_LABEL,
    GAME_MASTER_LABEL,
    GAME_NEXT_SESSION_DATE_FORMAT,
    GAME_NEXT_SESSION_EMPTY,
    GAME_NEXT_SESSION_LABEL,
    GAME_ONLINE_PLATFORM_LABELS,
    GAME_RECRUITMENT_CLOSED_BADGE,
    GAME_RECRUITMENT_FULL_BADGE,
    GAME_STATUS_COLORS,
    GAME_STATUS_LABELS,
    GAME_SYSTEM_LABELS,
    GAME_VIRTUAL_TABLE_LABEL,
    GAME_VISIBILITY_LABELS,
    getGameAgeLabel,
    getGameFormatLabel,
    getGamePlayersLabel,
    getGameStartingLevelLabel,
    isGameRecruitmentClosed,
    MASTER_PROFILE_OPEN_HINT,
  } from '../../model';
  import { GameCover } from '../../ui';

  /** Значок состояния игры: набор, доступность, стоимость. */
  interface StateBadge {
    key: string;
    label: string;
    color: BadgeProps['color'];
    icon?: string;
  }

  /** Строка условий: подпись слева, значение справа. */
  interface GameFact {
    key: string;
    label: string;
    value: string;
  }

  /** Ссылка игры: виртуальный стол или разговор. */
  interface GameLink {
    key: string;
    label: string;
    icon: string;
    url: string;
  }

  const {
    game,
    masterName,
    nextSessionAt = null,
  } = defineProps<{
    game: Game;
    /** Отображаемое имя мастера; UUID пользователю показывать нельзя. */
    masterName: string;
    /**
     * Начало ближайшей встречи из загруженного расписания. Считается снаружи:
     * сервис заполняет ближайшую встречу только в выдаче каталога, а по одной
     * игре отдаёт пустое поле — тогда дату видно лишь тому, кому сервис отдал
     * и само расписание.
     */
    nextSessionAt?: string | null;
  }>();

  /**
   * Состояние игры цветными значками: сначала набор, потом стоимость. Это
   * первое, что читают в объявлении, поэтому значки идут над всем остальным,
   * а не теряются в общем ряду условий.
   */
  const stateBadges = computed<Array<StateBadge>>(() => {
    const items: Array<StateBadge> = [
      {
        key: 'status',
        label: GAME_STATUS_LABELS[game.status],
        color: GAME_STATUS_COLORS[game.status],
      },
    ];

    if (isGameRecruitmentClosed(game)) {
      items.push({
        key: 'recruitment',
        label:
          game.takenSeats >= game.maxPlayers
            ? GAME_RECRUITMENT_FULL_BADGE
            : GAME_RECRUITMENT_CLOSED_BADGE,
        icon: 'tabler:user-off',
        color: 'warning',
      });
    }

    if (game.visibility === 'PRIVATE') {
      items.push({
        key: 'visibility',
        label: GAME_VISIBILITY_LABELS.PRIVATE,
        icon: 'tabler:lock',
        color: 'neutral',
      });
    }

    items.push({
      key: 'cost',
      label: GAME_COST_TYPE_LABELS[game.costType],
      icon: 'tabler:coins',
      color: game.costType === 'FREE' ? 'success' : 'warning',
    });

    return items;
  });

  const { format } = useDayjs();

  /**
   * Дата ближайшей встречи. Своей даты у игры нет — время назначается
   * встречам; пока расписания нет, строка говорит об этом прямо.
   */
  const nextSessionValue = computed(() => {
    const startsAt = nextSessionAt ?? game.nextSession?.startsAt;

    return startsAt
      ? format(startsAt, GAME_NEXT_SESSION_DATE_FORMAT)
      : GAME_NEXT_SESSION_EMPTY;
  });

  /**
   * Условия игры списком. Пустые условия строкой не занимают места: у онлайна
   * нет места встречи, у части игр — жанра и возрастных границ.
   */
  const facts = computed<Array<GameFact>>(() => {
    const items: Array<GameFact> = [
      {
        key: 'next-session',
        label: GAME_NEXT_SESSION_LABEL,
        value: nextSessionValue.value,
      },
      {
        key: 'format',
        label: GAME_FACT_LABELS.format,
        value: getGameFormatLabel(game),
      },
    ];

    if (game.type === 'ONLINE' && game.onlinePlatform) {
      items.push({
        key: 'platform',
        label: GAME_FACT_LABELS.platform,
        value: GAME_ONLINE_PLATFORM_LABELS[game.onlinePlatform],
      });
    }

    if (game.venue) {
      items.push({
        key: 'venue',
        label: GAME_FACT_LABELS.venue,
        value: game.venue,
      });
    }

    items.push(
      {
        key: 'system',
        label: GAME_FACT_LABELS.system,
        value: GAME_SYSTEM_LABELS[game.system],
      },
      {
        key: 'duration',
        label: GAME_FACT_LABELS.duration,
        value: GAME_DURATION_TYPE_LABELS[game.durationType],
      },
    );

    if (game.genre) {
      items.push({
        key: 'genre',
        label: GAME_FACT_LABELS.genre,
        value: game.genre,
      });
    }

    items.push(
      {
        key: 'players',
        label: GAME_FACT_LABELS.players,
        value: getGamePlayersLabel(game),
      },
      {
        key: 'level',
        label: GAME_FACT_LABELS.level,
        value: getGameStartingLevelLabel(game),
      },
    );

    const ageLabel = getGameAgeLabel(game);

    if (ageLabel) {
      items.push({
        key: 'age',
        label: GAME_FACT_LABELS.age,
        value: ageLabel,
      });
    }

    if (game.crossplayAllowed) {
      items.push({
        key: 'crossplay',
        label: GAME_FACT_LABELS.crossplay,
        value: GAME_CROSSPLAY_ALLOWED_VALUE,
      });
    }

    return items;
  });

  /**
   * Ссылки игры. Чат игры сервис отдаёт только мастеру и принятым игрокам —
   * остальным поле приходит пустым, и ссылки просто нет.
   */
  const links = computed<Array<GameLink>>(() => {
    const items: Array<GameLink> = [];

    if (game.virtualTableUrl) {
      items.push({
        key: 'table',
        label: GAME_VIRTUAL_TABLE_LABEL,
        icon: 'tabler:dice',
        url: game.virtualTableUrl,
      });
    }

    if (game.masterChatUrl) {
      items.push({
        key: 'master-chat',
        label: GAME_MASTER_CHAT_LINK_LABEL,
        icon: 'tabler:message-circle',
        url: game.masterChatUrl,
      });
    }

    if (game.gameChatUrl) {
      items.push({
        key: 'game-chat',
        label: GAME_CHAT_LINK_LABEL,
        icon: 'tabler:users-group',
        url: game.gameChatUrl,
      });
    }

    return items;
  });

  const { open: openProfile } = useMasterProfileDrawer();

  /** Открывает профиль мастера этой игры. */
  function openMasterProfile(): void {
    openProfile(game.masterId, masterName);
  }
</script>

<!--
  Сводка объявления: обложка, состояние набора, мастер, условия игры, ссылки и
  главное действие. Всё, по чему решают «идти или нет», собрано в один столбец
  и держится рядом с кнопкой заявки, а страница слева остаётся под чтение —
  описание, требования и расписание.
-->
<template>
  <section
    class="overflow-hidden rounded-xl border border-default bg-elevated"
    :aria-label="game.title"
  >
    <GameCover
      :image-url="game.imageUrl"
      :alt="game.title"
      :game-type="game.type"
    />

    <div class="flex flex-col gap-4 p-4">
      <div class="flex flex-wrap items-center gap-1.5">
        <UBadge
          v-for="badge in stateBadges"
          :key="badge.key"
          :color="badge.color"
          variant="subtle"
          size="sm"
          :icon="badge.icon"
          :label="badge.label"
        />
      </div>

      <!-- Имя ведёт в профиль: перед заявкой игрок хочет понять, с кем
        садится за стол -->
      <div class="flex items-center gap-2 text-sm">
        <UIcon
          name="tabler:crown"
          class="size-4 shrink-0 text-muted"
        />

        <span class="shrink-0 text-muted">{{ GAME_MASTER_LABEL }}:</span>

        <ULink
          as="button"
          type="button"
          class="truncate text-left font-medium text-primary"
          :title="MASTER_PROFILE_OPEN_HINT"
          @click.left.exact.prevent="openMasterProfile"
        >
          {{ masterName }}
        </ULink>
      </div>

      <dl class="flex flex-col divide-y divide-default text-sm">
        <div
          v-for="fact in facts"
          :key="fact.key"
          class="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
        >
          <dt class="shrink-0 text-muted">{{ fact.label }}</dt>

          <dd class="text-right font-medium text-toned">{{ fact.value }}</dd>
        </div>
      </dl>

      <div
        v-if="links.length"
        class="flex flex-col gap-2"
      >
        <span class="text-sm font-semibold text-highlighted">
          {{ GAME_LINKS_TITLE }}
        </span>

        <UButton
          v-for="link in links"
          :key="link.key"
          :to="link.url"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="subtle"
          size="sm"
          block
          :icon="link.icon"
          :label="link.label"
          trailing-icon="tabler:external-link"
          :ui="{ label: 'flex-auto text-left' }"
        />
      </div>

      <!-- Действия отдаёт страница: заявка, её отзыв и разбор заявок зависят
        от прав зрителя, а сводка о них ничего не знает -->
      <slot name="actions" />
    </div>
  </section>
</template>
