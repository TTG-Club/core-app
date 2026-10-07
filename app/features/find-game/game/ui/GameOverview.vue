<script setup lang="ts">
  import type { Game } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import {
    GAME_ALLOWED_SOURCES_HIDE_LABEL,
    GAME_ALLOWED_SOURCES_SHOW_LABEL,
    GAME_ALLOWED_SOURCES_TITLE,
    GAME_ALLOWED_SOURCES_VISIBLE_LIMIT,
    GAME_DESCRIPTION_TITLE,
    GAME_REQUIREMENTS_TITLE,
  } from '../../model';
  import { toGameMarkup } from '../../ui';

  const { game } = defineProps<{
    game: Game;
  }>();

  const descriptionNodes = computed(() => toGameMarkup(game.description));
  const isAllowedSourcesOpen = ref(false);

  const visibleAllowedSources = computed(() =>
    game.allowedSources.slice(0, GAME_ALLOWED_SOURCES_VISIBLE_LIMIT),
  );

  const remainingAllowedSources = computed(() =>
    game.allowedSources.slice(GAME_ALLOWED_SOURCES_VISIBLE_LIMIT),
  );

  const allowedSourcesToggleLabel = computed(() =>
    isAllowedSourcesOpen.value
      ? GAME_ALLOWED_SOURCES_HIDE_LABEL
      : `${GAME_ALLOWED_SOURCES_SHOW_LABEL} (${remainingAllowedSources.value.length})`,
  );

  const allowedSourcesToggleIcon = computed(() =>
    isAllowedSourcesOpen.value ? 'tabler:chevron-up' : 'tabler:chevron-down',
  );
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
          v-for="source in visibleAllowedSources"
          :key="source"
          color="neutral"
          variant="subtle"
          size="md"
          :label="source"
        />
      </div>

      <UCollapsible
        v-if="remainingAllowedSources.length"
        v-model:open="isAllowedSourcesOpen"
        class="flex flex-col gap-2"
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :icon="allowedSourcesToggleIcon"
          :label="allowedSourcesToggleLabel"
          class="self-start"
        />

        <template #content>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="source in remainingAllowedSources"
              :key="source"
              color="neutral"
              variant="subtle"
              size="md"
              :label="source"
            />
          </div>
        </template>
      </UCollapsible>
    </article>
  </section>
</template>
