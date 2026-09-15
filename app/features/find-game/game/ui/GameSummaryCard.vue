<script setup lang="ts">
  import type { BadgeProps } from '@nuxt/ui';

  import type { Game } from '../../model';

  import { UserAvatar } from '~ui/user-avatar';

  import {
    useGameSystems,
    useMasterProfileDrawer,
    useParticipantNames,
  } from '../../composables';
  import {
    GAME_CHAT_LINK_LABEL,
    GAME_COST_TYPE_COLORS,
    GAME_COST_TYPE_ICONS,
    GAME_COST_TYPE_LABELS,
    GAME_CROSSPLAY_ALLOWED_VALUE,
    GAME_DURATION_TYPE_LABELS,
    GAME_FACT_LABELS,
    GAME_LINKS_TITLE,
    GAME_MASTER_CHAT_LINK_LABEL,
    GAME_MASTER_LABEL,
    GAME_NEXT_PAID_SESSION_PRICE_LABEL,
    GAME_NEXT_SESSION_DATE_FORMAT,
    GAME_NEXT_SESSION_EMPTY,
    GAME_NEXT_SESSION_LABEL,
    GAME_ONLINE_PLATFORM_LABELS,
    GAME_RECRUITMENT_CLOSED_BADGE,
    GAME_RECRUITMENT_FULL_BADGE,
    GAME_STATUS_COLORS,
    GAME_STATUS_LABELS,
    GAME_VIRTUAL_TABLE_ICON,
    GAME_VIRTUAL_TABLE_LABEL,
    GAME_VIRTUAL_TABLE_MEMBERS_ONLY_HINT,
    GAME_VISIBILITY_LABELS,
    getGameAgeLabel,
    getGameFormatLabel,
    getGamePlayersLabel,
    getGameStartingLevelLabel,
    getGenresLabel,
    isGameRecruitmentClosed,
    MASTER_PROFILE_OPEN_HINT,
  } from '../../model';
  import { GameCover, ParticipantName } from '../../ui';

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
    nextSessionAt = null,
    nextPaidSessionPrice = null,
  } = defineProps<{
    game: Game;
    /**
     * Начало ближайшей встречи из загруженного расписания. Считается снаружи:
     * сервис заполняет ближайшую встречу только в выдаче каталога, а по одной
     * игре отдаёт пустое поле — тогда дату видно лишь тому, кому сервис отдал
     * и само расписание.
     */
    nextSessionAt?: string | null;
    /** Цена ближайшей платной сессии из открытого расписания игры. */
    nextPaidSessionPrice?: string | null;
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
      icon: GAME_COST_TYPE_ICONS[game.costType],
      color: GAME_COST_TYPE_COLORS[game.costType],
    });

    return items;
  });

  const { format } = useDayjs();
  const { getGameSystemLabel } = useGameSystems();

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

    if (game.costType === 'PAID' && nextPaidSessionPrice) {
      items.push({
        key: 'next-paid-session-price',
        label: GAME_NEXT_PAID_SESSION_PRICE_LABEL,
        value: nextPaidSessionPrice,
      });
    }

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
        value: getGameSystemLabel(game),
      },
      {
        key: 'duration',
        label: GAME_FACT_LABELS.duration,
        value: GAME_DURATION_TYPE_LABELS[game.durationType],
      },
    );

    const genres = getGenresLabel(game);

    if (genres) {
      items.push({
        key: 'genres',
        label: GAME_FACT_LABELS.genres,
        value: genres,
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
   * Ссылки игры. Стол и чат игры сервис отдаёт только мастеру и принятым
   * игрокам — остальным поля приходят пустыми, и ссылок просто нет.
   */
  const links = computed<Array<GameLink>>(() => {
    const items: Array<GameLink> = [];

    if (game.virtualTableUrl) {
      items.push({
        key: 'table',
        label: GAME_VIRTUAL_TABLE_LABEL,
        icon: GAME_VIRTUAL_TABLE_ICON,
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

  /**
   * Стол у игры есть, но ссылку зрителю не отдали: мастер его ещё не принял.
   * Вместо ссылки об этом говорит пояснение — иначе стол выглядит забытым.
   */
  const isVirtualTableMembersOnly = computed(
    () => game.hasVirtualTable && !game.virtualTableUrl,
  );

  /** Блок ссылок нужен, если есть хоть одна ссылка или пояснение о столе. */
  const hasLinksSection = computed(
    () => links.value.length > 0 || isVirtualTableMembersOnly.value,
  );

  // UUID мастера пользователю показывать нельзя: имя приходит из core-api.
  const { getParticipantAvatarName } = useParticipantNames();

  const { open: openProfile } = useMasterProfileDrawer();

  /** Открывает профиль мастера этой игры. */
  function openMasterProfile(): void {
    openProfile(game.masterId);
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
          size="md"
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

        <UserAvatar
          :user-id="game.masterId"
          :name="getParticipantAvatarName(game.masterId)"
          size="2xs"
          class="shrink-0"
        />

        <ULink
          as="button"
          type="button"
          class="truncate text-left font-medium text-primary"
          :title="MASTER_PROFILE_OPEN_HINT"
          @click.left.exact.prevent="openMasterProfile"
        >
          <ParticipantName :user-id="game.masterId" />
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
        v-if="hasLinksSection"
        class="flex flex-col gap-2"
      >
        <span class="text-sm font-semibold text-highlighted">
          {{ GAME_LINKS_TITLE }}
        </span>

        <!-- Отступами и значками повторяет кнопку ссылки ниже, но не нажимается:
          пунктир и замок говорят, что стол есть, а ссылка пока закрыта -->
        <div
          v-if="isVirtualTableMembersOnly"
          class="flex items-center gap-2 rounded-md border border-dashed border-accented px-3 py-2 text-sm"
        >
          <UIcon
            :name="GAME_VIRTUAL_TABLE_ICON"
            class="size-5 shrink-0 text-dimmed"
          />

          <div class="flex min-w-0 flex-auto flex-col">
            <span class="font-medium text-muted">
              {{ GAME_VIRTUAL_TABLE_LABEL }}
            </span>

            <span class="text-xs text-dimmed">
              {{ GAME_VIRTUAL_TABLE_MEMBERS_ONLY_HINT }}
            </span>
          </div>

          <UIcon
            name="tabler:lock"
            class="size-5 shrink-0 text-dimmed"
          />
        </div>

        <UButton
          v-for="link in links"
          :key="link.key"
          :to="link.url"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="subtle"
          size="lg"
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
