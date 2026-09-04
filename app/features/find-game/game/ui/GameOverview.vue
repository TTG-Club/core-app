<script setup lang="ts">
  import type { Game } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import { useMasterProfileDrawer } from '../../composables';
  import {
    GAME_ALLOWED_SOURCES_TITLE,
    GAME_CHAT_LINK_LABEL,
    GAME_DESCRIPTION_TITLE,
    GAME_MASTER_CHAT_LINK_LABEL,
    GAME_MASTER_LABEL,
    GAME_REQUIREMENTS_TITLE,
    GAME_VENUE_LABEL,
    GAME_VIRTUAL_TABLE_LABEL,
    MASTER_PROFILE_OPEN_HINT,
  } from '../../model';
  import { GameCover, GameMetaBadges, toGameMarkup } from '../../ui';

  const { game, masterName } = defineProps<{
    game: Game;
    /** Отображаемое имя мастера; UUID пользователю показывать нельзя. */
    masterName: string;
  }>();

  const descriptionNodes = computed(() => toGameMarkup(game.description));

  const { open: openProfile } = useMasterProfileDrawer();

  /** Открывает профиль мастера этой игры. */
  function openMasterProfile(): void {
    openProfile(game.masterId, masterName);
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-4 md:grid-cols-[minmax(0,20rem)_1fr] md:items-start">
      <GameCover
        :image-url="game.imageUrl"
        :alt="game.title"
        :game-type="game.type"
      />

      <div class="flex flex-col gap-3">
        <div
          v-if="game.genre"
          class="text-sm text-muted"
        >
          {{ game.genre }}
        </div>

        <GameMetaBadges
          :game="game"
          show-status
        />

        <div class="flex flex-wrap items-center gap-3 text-sm">
          <!-- Имя ведёт в профиль: перед заявкой игрок хочет понять, с кем
            садится за стол -->
          <span class="flex items-center gap-1.5 text-toned">
            <UIcon
              name="tabler:crown"
              class="size-4 text-muted"
            />
            {{ GAME_MASTER_LABEL }}:

            <ULink
              as="button"
              type="button"
              class="text-primary"
              :title="MASTER_PROFILE_OPEN_HINT"
              @click.left.exact.prevent="openMasterProfile"
            >
              {{ masterName }}
            </ULink>
          </span>

          <!-- Город говорит, доедет ли игрок вообще; место — как добираться -->
          <span
            v-if="game.venue"
            class="flex items-center gap-1.5 text-toned"
          >
            <UIcon
              name="tabler:map-pin"
              class="size-4 text-muted"
            />
            {{ GAME_VENUE_LABEL }}: {{ game.venue }}
          </span>

          <ULink
            v-if="game.virtualTableUrl"
            :to="game.virtualTableUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-primary"
          >
            <UIcon
              name="tabler:external-link"
              class="size-4"
            />
            {{ GAME_VIRTUAL_TABLE_LABEL }}
          </ULink>

          <!-- Разговор с мастером открыт всем: без него не о чем
            договариваться до заявки -->
          <ULink
            v-if="game.masterChatUrl"
            :to="game.masterChatUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-primary"
          >
            <UIcon
              name="tabler:message-circle"
              class="size-4"
            />
            {{ GAME_MASTER_CHAT_LINK_LABEL }}
          </ULink>

          <!-- Чат игры сервис отдаёт только мастеру и принятым игрокам:
            остальным поле приходит пустым, и ссылки просто нет -->
          <ULink
            v-if="game.gameChatUrl"
            :to="game.gameChatUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-primary"
          >
            <UIcon
              name="tabler:users-group"
              class="size-4"
            />
            {{ GAME_CHAT_LINK_LABEL }}
          </ULink>
        </div>

        <!-- Требования соседствуют с условиями игры, а не уезжают под
          описание: рядом с составом и уровнем их читают заодно, и колонка у
          обложки перестаёт пустовать -->
        <section
          v-if="game.requirements"
          class="flex flex-col gap-2 pt-1"
        >
          <h3 class="font-semibold text-highlighted">
            {{ GAME_REQUIREMENTS_TITLE }}
          </h3>

          <p class="text-sm whitespace-pre-line text-toned">
            {{ game.requirements }}
          </p>
        </section>
      </div>
    </div>

    <section class="flex flex-col gap-2">
      <h3 class="text-lg font-semibold text-highlighted">
        {{ GAME_DESCRIPTION_TITLE }}
      </h3>

      <MarkupRender :render-node="descriptionNodes" />
    </section>

    <section
      v-if="game.allowedSources.length"
      class="flex flex-col gap-2"
    >
      <h3 class="text-lg font-semibold text-highlighted">
        {{ GAME_ALLOWED_SOURCES_TITLE }}
      </h3>

      <div class="flex flex-wrap gap-1.5">
        <UBadge
          v-for="source in game.allowedSources"
          :key="source"
          color="neutral"
          variant="subtle"
          size="sm"
          :label="source"
        />
      </div>
    </section>
  </div>
</template>
