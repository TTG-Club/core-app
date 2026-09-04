<script setup lang="ts">
  import type { BadgeProps } from '@nuxt/ui';

  import type { Game } from '../model';

  import {
    GAME_COST_TYPE_LABELS,
    GAME_CROSSPLAY_LABEL,
    GAME_DURATION_TYPE_LABELS,
    GAME_RECRUITMENT_CLOSED_BADGE,
    GAME_RECRUITMENT_FULL_BADGE,
    GAME_STATUS_COLORS,
    GAME_STATUS_LABELS,
    GAME_SYSTEM_LABELS,
    GAME_TYPE_ICONS,
    GAME_VISIBILITY_LABELS,
    getGameAgeLabel,
    getGameFormatLabel,
    getGamePlayersLabel,
    getGameStartingLevelLabel,
    isGameRecruitmentClosed,
  } from '../model';

  /** Значок в списке: ключ нужен только рендеру. */
  interface MetaBadge {
    key: string;
    label: string;
    icon?: string;
    color: BadgeProps['color'];
  }

  const { game, showStatus = false } = defineProps<{
    game: Game;
    /** Показывать ли статус игры: в каталоге он лишний, в карточке — нужен. */
    showStatus?: boolean;
  }>();

  /** Значки игры: формат, система, стоимость и прочие условия участия. */
  const badges = computed<Array<MetaBadge>>(() => {
    const items: Array<MetaBadge> = [];

    if (showStatus) {
      items.push({
        key: 'status',
        label: GAME_STATUS_LABELS[game.status],
        color: GAME_STATUS_COLORS[game.status],
      });

      // Закрытый набор виден только своим — в поиске такой игры нет, —
      // поэтому пометка идёт рядом со статусом, а не в общем ряду условий.
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
    }

    items.push(
      {
        key: 'format',
        label: getGameFormatLabel(game),
        icon: GAME_TYPE_ICONS[game.type],
        color: 'neutral',
      },
      {
        key: 'system',
        label: GAME_SYSTEM_LABELS[game.system],
        icon: 'tabler:book',
        color: 'neutral',
      },
      {
        key: 'cost',
        label: GAME_COST_TYPE_LABELS[game.costType],
        icon: 'tabler:coins',
        color: game.costType === 'FREE' ? 'success' : 'warning',
      },
      {
        key: 'players',
        label: getGamePlayersLabel(game),
        icon: 'tabler:users',
        color: 'neutral',
      },
      {
        key: 'duration',
        label: GAME_DURATION_TYPE_LABELS[game.durationType],
        icon: 'tabler:calendar-repeat',
        color: 'neutral',
      },
      {
        key: 'level',
        label: getGameStartingLevelLabel(game),
        icon: 'tabler:stairs-up',
        color: 'neutral',
      },
    );

    const ageLabel = getGameAgeLabel(game);

    if (ageLabel) {
      items.push({
        key: 'age',
        label: ageLabel,
        icon: 'tabler:id-badge',
        color: 'neutral',
      });
    }

    if (game.crossplayAllowed) {
      items.push({
        key: 'crossplay',
        label: GAME_CROSSPLAY_LABEL,
        icon: 'tabler:gender-bigender',
        color: 'neutral',
      });
    }

    return items;
  });
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <UBadge
      v-for="badge in badges"
      :key="badge.key"
      :color="badge.color"
      variant="subtle"
      size="sm"
      :icon="badge.icon"
      :label="badge.label"
    />
  </div>
</template>
