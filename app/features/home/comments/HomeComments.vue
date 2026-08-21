<script setup lang="ts">
  import type {
    CommentEntry,
    CommentsPage,
    PublicComment,
  } from '~comments/model';

  import {
    fetchRecentComments,
    filterLiveComments,
    HOME_COMMENTS_ALL_LABEL,
    HOME_COMMENTS_COUNT,
    HOME_COMMENTS_EMPTY_TEXT,
    readWithoutStaleToken,
    RECENT_COMMENTS_ROUTE,
    RECENT_COMMENTS_TITLE,
  } from '~comments/model';

  import { HomeCommentRow } from './ui';

  // Клиентская (не-SSR) загрузка: блок ниже сгиба и не должен держать TTFB
  // главной в ожидании сервиса комментариев (как HomeNews / HomeArticles).
  // Пока запрос идёт — показываем скелетон, а не блокируем страницу.
  const { data, status, refresh } = await useAsyncData<
    CommentsPage<PublicComment>
  >(
    'home-comments',
    () =>
      readWithoutStaleToken(() => fetchRecentComments(0, HOME_COMMENTS_COUNT)),
    { lazy: true, server: false },
  );

  const comments = computed<Array<CommentEntry>>(() =>
    filterLiveComments(data.value?.items ?? []),
  );

  const hasComments = computed(() => comments.value.length > 0);

  // Главную часто держат открытой, а комментарии оставляют прямо во время
  // чтения. Чтобы блок был актуальным без F5 — перезапрашиваем его при
  // возврате на вкладку (hidden → visible).
  const visibility = useDocumentVisibility();

  watch(visibility, (state, previous) => {
    if (state === 'visible' && previous === 'hidden') {
      refresh();
    }
  });

  // Скелетон — только на ПЕРВОЙ загрузке (данных ещё нет); idle тоже держим как
  // loading (server:false: до клиентского фетча статус 'idle'). Фоновое
  // обновление не мигает скелетоном поверх уже показанных комментариев.
  const isLoading = computed(
    () =>
      (status.value === 'pending' || status.value === 'idle')
      && !hasComments.value,
  );

  // Блок прячем целиком, только если лента ТАК И НЕ загрузилась (сервис ещё не
  // задеплоен и т.п.) — аккуратнее показать главную без блока, чем ошибку.
  const isError = computed(
    () => status.value === 'error' && !hasComments.value,
  );
</script>

<template>
  <UCard
    v-if="!isError"
    :ui="{
      root: 'bg-muted overflow-hidden xl:flex xl:h-full xl:flex-col',
      header: 'p-3 sm:p-3',
      body: 'p-0 sm:p-0 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col',
    }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:message-circle"
          class="size-5 text-primary"
        />

        <h3 class="text-base leading-none font-medium">
          {{ RECENT_COMMENTS_TITLE }}
        </h3>
      </div>
    </template>

    <div
      v-if="isLoading"
      class="flex flex-col gap-3 p-3"
    >
      <USkeleton
        v-for="index in HOME_COMMENTS_COUNT"
        :key="index"
        class="h-12 w-full rounded-xl"
      />
    </div>

    <p
      v-else-if="!hasComments"
      class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_COMMENTS_EMPTY_TEXT }}
    </p>

    <div
      v-else
      class="flex flex-col xl:min-h-0 xl:flex-1"
    >
      <!-- Лента длиннее колонки не растёт: на десктопе занимает оставшуюся
        высоту, на узком экране ограничена, и в обоих случаях прокручивается -->
      <UScrollArea
        class="max-h-125 min-h-0 xl:max-h-none xl:flex-1"
        :ui="{ viewport: 'p-2' }"
      >
        <div class="flex flex-col gap-1">
          <HomeCommentRow
            v-for="comment in comments"
            :key="comment.id"
            :comment
          />
        </div>
      </UScrollArea>

      <UButton
        :to="RECENT_COMMENTS_ROUTE"
        :label="HOME_COMMENTS_ALL_LABEL"
        block
        size="lg"
        color="neutral"
        variant="soft"
        trailing-icon="tabler:arrow-right"
        class="justify-center rounded-none border-t border-default"
      />
    </div>
  </UCard>
</template>
