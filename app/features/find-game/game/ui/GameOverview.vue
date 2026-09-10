<script setup lang="ts">
  import type { Game } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import {
    GAME_ALLOWED_SOURCES_TITLE,
    GAME_DESCRIPTION_TITLE,
    GAME_REQUIREMENTS_TITLE,
  } from '../../model';
  import { toGameMarkup } from '../../ui';

  const { game } = defineProps<{
    game: Game;
  }>();

  const descriptionNodes = computed(() => toGameMarkup(game.description));
</script>

<!--
  Читаемая часть объявления. Условия игры сюда не попадают — они собраны в
  сводке рядом; здесь остаётся сплошной текст, который читают подряд, поэтому
  разделы идут одной колонкой и отделены линиями, а не рамками: рамка внутри
  рамки дробит страницу, а линия просто говорит, где кончается мысль.
-->
<template>
  <section
    class="flex flex-col divide-y divide-default rounded-xl border border-default bg-elevated"
  >
    <article class="flex flex-col gap-2 p-4 sm:p-5">
      <h2 class="text-lg font-semibold text-highlighted">
        {{ GAME_DESCRIPTION_TITLE }}
      </h2>

      <MarkupRender :render-node="descriptionNodes" />
    </article>

    <article
      v-if="game.requirements"
      class="flex flex-col gap-2 p-4 sm:p-5"
    >
      <h2 class="text-lg font-semibold text-highlighted">
        {{ GAME_REQUIREMENTS_TITLE }}
      </h2>

      <p class="whitespace-pre-line text-toned">
        {{ game.requirements }}
      </p>
    </article>

    <article
      v-if="game.allowedSources.length"
      class="flex flex-col gap-2 p-4 sm:p-5"
    >
      <h2 class="text-lg font-semibold text-highlighted">
        {{ GAME_ALLOWED_SOURCES_TITLE }}
      </h2>

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
    </article>
  </section>
</template>
