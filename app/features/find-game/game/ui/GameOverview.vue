<script setup lang="ts">
  import type { RenderNode } from '~ui/markup';

  import type { Game } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import {
    GAME_ALLOWED_SOURCES_TITLE,
    GAME_DESCRIPTION_TITLE,
    GAME_MASTER_LABEL,
    GAME_REQUIREMENTS_TITLE,
    GAME_VIRTUAL_TABLE_LABEL,
  } from '../../model';
  import { GameCover, GameMetaBadges, toGameMarkup } from '../../ui';

  const { game, masterName } = defineProps<{
    game: Game;
    /** Отображаемое имя мастера; UUID пользователю показывать нельзя. */
    masterName: string;
  }>();

  // Описание пишется редактором разметки. Приведение к `RenderNode` безопасно:
  // `parse` возвращает плоский массив узлов, который `MarkupRender` принимает
  // как «несколько записей».
  const descriptionNodes = computed(
    () => toGameMarkup(game.description) as RenderNode,
  );
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
          <span class="flex items-center gap-1.5 text-toned">
            <UIcon
              name="tabler:crown"
              class="size-4 text-muted"
            />
            {{ GAME_MASTER_LABEL }}: {{ masterName }}
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
