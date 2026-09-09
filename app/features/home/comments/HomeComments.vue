<script setup lang="ts">
  import type {
    CommentEntry,
    CommentsPage,
    PublicComment,
  } from '~comments/model';

  import {
    fetchRecentComments,
    filterLiveComments,
    HOME_COMMENTS_COUNT,
    HOME_COMMENTS_EMPTY_TEXT,
    readWithoutStaleToken,
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
  <!-- Лента без собственной оправы: панель и переключатель вкладок держит
    HomeActivity, где эта лента соседствует с обновлениями каталога -->
  <div
    v-if="isLoading"
    class="flex flex-col gap-2 p-3"
  >
    <USkeleton
      v-for="index in HOME_COMMENTS_COUNT"
      :key="index"
      class="h-14 w-full rounded-xl"
    />
  </div>

  <p
    v-else-if="isError || !hasComments"
    class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
  >
    {{ HOME_COMMENTS_EMPTY_TEXT }}
  </p>

  <!-- С xl лента занимает ровно остаток высоты панели, которую задал соседний
    блок новостей; ниже xl ряда нет, и её держит собственный предел высоты -->
  <UScrollArea
    v-else
    class="max-h-150 xl:h-full xl:max-h-none"
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
</template>
