<script setup lang="ts">
  import type { CommentTreeActions } from '../model';

  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { UiResult } from '~ui/result';
  import { AuthModal } from '~user/auth-modal';

  import { useCommentsSection } from '../composables';
  import {
    COMMENT_ANCHOR_PREFIX,
    COMMENT_HIGHLIGHT_DURATION_MS,
    COMMENTS_PLURAL_FORMS,
    getCommentAnchorId,
    getCommentErrorMessage,
    getCommentFetchStatus,
  } from '../model';
  import {
    CommentComposer,
    CommentsLoginNote,
    CommentsPreviewCard,
    CommentsSkeleton,
    CommentThread,
  } from './ui';

  const {
    section,
    url,
    title = 'Комментарии',
  } = defineProps<{
    /** Раздел сайта в сервисе комментариев (например, `articles`). */
    section: string;
    /** URL страницы внутри раздела — ключ обсуждения. */
    url: string;
    /** Заголовок блока. */
    title?: string;
  }>();

  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const { isLoggedIn, fetch: fetchProfile } = useUser();

  /**
   * Есть ли сессия: профиль уже загружен (вход через шлем сайта) или есть
   * кука токена. Одной куки мало: Nuxt кэширует её значение с момента
   * гидрации, и после входа через общую модалку кэш остаётся пустым.
   */
  const hasSession = computed(() => isLoggedIn.value || Boolean(token.value));

  const isAuthOpen = ref(false);

  /** Лента уже загружалась в этой сессии (защита от повторной загрузки). */
  const isInitialized = ref(false);

  /**
   * Свёрнутый режим (как в ВК): показывается последний комментарий и кнопка
   * разворачивания; полная лента грузится только по клику.
   */
  const isExpanded = ref(false);

  const route = useRoute();

  const {
    rootNodes,
    totalCount,
    latestComment,
    isLoading,
    isPreviewLoading,
    isLoadingMore,
    isLastPage,
    loadError,

    loadPreview,
    loadComments,
    loadMoreComments,
    toggleReplies,
    revealComment,
    submitRootComment,
    submitReply,
    submitEdit,
    removeComment,
    submitReport,
    isOwnComment,
    isCommentReported,
  } = useCommentsSection({ section, url });

  const treeActions: CommentTreeActions = {
    toggleReplies,
    submitReply,
    submitEdit,
    removeComment,
    submitReport,
    isOwnComment,
    isCommentReported,
    highlightComment,
    getCommentLink,
  };

  /**
   * Абсолютная якорная ссылка на комментарий. Строится от канонического
   * адреса обсуждения, а не от текущего: в дровере и широкой панели адрес
   * вкладки — это список, и ссылка с него не привела бы к комментарию.
   */
  function getCommentLink(commentId: string): string {
    return `${getOrigin()}${url}#${getCommentAnchorId(commentId)}`;
  }

  const hasComments = computed(() => rootNodes.value.length > 0);

  /** Подпись кнопки разворачивания свёрнутого блока. */
  const expandButtonLabel = computed(() =>
    totalCount.value > 0
      ? `Показать ${totalCount.value} ${getPlural(totalCount.value, COMMENTS_PLURAL_FORMS)}`
      : 'Написать комментарий',
  );

  /** Сервис закрыт авторизацией целиком: 401 на чтение = протух токен. */
  const isAuthError = computed(
    () => getCommentFetchStatus(loadError.value) === 401,
  );

  const showLoginNote = computed(() => !hasSession.value || isAuthError.value);

  const loadErrorMessage = computed(() =>
    getCommentErrorMessage(loadError.value),
  );

  /** Комментарий, подсвеченный после перехода по якорной ссылке. */
  const highlightedCommentId = ref<string | null>(null);

  const { start: startHighlightFade, stop: stopHighlightFade } = useTimeoutFn(
    () => {
      highlightedCommentId.value = null;
    },
    COMMENT_HIGHLIGHT_DURATION_MS,
    { immediate: false },
  );

  /**
   * Коротко подсвечивает комментарий: фон появляется сразу и через паузу
   * плавно угасает (переход навешен на снятие класса в карточке).
   */
  function flashComment(commentId: string): void {
    stopHighlightFade();
    highlightedCommentId.value = commentId;
    startHighlightFade();
  }

  /**
   * Скроллит к уже отрисованному комментарию и коротко подсвечивает его
   * (переход по якорю, «Показать родительский» из меню ответа).
   */
  function highlightComment(commentId: string): void {
    document
      .getElementById(getCommentAnchorId(commentId))
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    flashComment(commentId);
  }

  /**
   * Открывает комментарий из якоря `#comment-<id>`: догружает ветки корней,
   * скроллит к карточке и коротко подсвечивает её.
   */
  async function revealCommentFromHash(): Promise<void> {
    const anchorId = route.hash.slice(1);

    if (!anchorId.startsWith(COMMENT_ANCHOR_PREFIX)) {
      return;
    }

    const commentId = anchorId.slice(COMMENT_ANCHOR_PREFIX.length);

    if (!commentId) {
      return;
    }

    const found = await revealComment(commentId);

    if (!found) {
      return;
    }

    await nextTick();
    highlightComment(commentId);
  }

  // Повторный переход по якорю без перезагрузки страницы (клик по ссылке
  // на другой комментарий, кнопка «назад») разворачивает блок, раскрывает
  // ветку и подсвечивает цель.
  watch(
    () => route.hash,
    () => {
      if (isInitialized.value && hasCommentAnchor()) {
        void expandAndReveal();
      }
    },
  );

  /** Есть ли в адресе якорь комментария. */
  function hasCommentAnchor(): boolean {
    return route.hash.slice(1).startsWith(COMMENT_ANCHOR_PREFIX);
  }

  /**
   * Разворачивает свёрнутый блок и грузит полную ленту.
   */
  async function expandComments(): Promise<void> {
    if (isExpanded.value) {
      return;
    }

    isExpanded.value = true;
    await loadComments();
  }

  function handleExpand(): void {
    void expandComments();
  }

  /**
   * Переход по якорю: сначала разворачивает блок, затем раскрывает ветку
   * и подсвечивает целевой комментарий.
   */
  async function expandAndReveal(): Promise<void> {
    await expandComments();
    await revealCommentFromHash();
  }

  /**
   * Первичная загрузка — только при живой сессии (сервис отвечает 401 даже
   * на чтение). Профиль тянем принудительно: свой `id` нужен для сравнения
   * с `authorId` (кнопки правки и удаления). Без якоря в адресе блок
   * стартует свёрнутым — грузится только превью.
   */
  async function initializeComments(): Promise<void> {
    if (!hasSession.value || isInitialized.value) {
      return;
    }

    isInitialized.value = true;

    if (!isLoggedIn.value) {
      void fetchProfile();
    }

    if (hasCommentAnchor()) {
      await expandAndReveal();

      return;
    }

    await loadPreview();
  }

  onMounted(initializeComments);

  // Вход и выход происходят в том числе через шлем сайта (общая модалка),
  // поэтому реагируем на общее состояние профиля: перечитываем кэш куки и
  // грузим ленту после входа; после выхода сбрасываем флаг — вернётся CTA,
  // а повторный вход перезагрузит ленту. Цикла нет: вотчер меняет только
  // локальный флаг и кэш куки, на isLoggedIn они не влияют.
  watch(isLoggedIn, (loggedIn) => {
    refreshCookie(USER_TOKEN_COOKIE);

    if (!loggedIn) {
      isInitialized.value = false;
      isExpanded.value = false;

      return;
    }

    void initializeComments();
  });

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  // После закрытия локального окна входа кука могла обновиться —
  // перечитываем её кэш и загружаем обсуждение уже с токеном.
  watch(isAuthOpen, (open) => {
    if (open) {
      return;
    }

    refreshCookie(USER_TOKEN_COOKIE);
    void initializeComments();
  });

  function handleLoadMore(): void {
    void loadMoreComments();
  }

  /** Повтор загрузки того режима, в котором случилась ошибка. */
  function handleRetry(): void {
    if (isExpanded.value) {
      void loadComments();
    } else {
      void loadPreview();
    }
  }

  const commentsListElement = useTemplateRef<HTMLElement>('commentsList');

  /**
   * Свежий комментарий появляется сверху ленты (сортировка «новые сверху»),
   * а форма стоит снизу — после отправки подводим взгляд к добавленной записи.
   */
  async function submitRootAndReveal(content: string): Promise<boolean> {
    const success = await submitRootComment(content);

    if (success) {
      await nextTick();

      commentsListElement.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    return success;
  }
</script>

<template>
  <section class="flex flex-col gap-4">
    <ClientOnly>
      <header class="flex items-center gap-2">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ title }}
        </h2>

        <UBadge
          v-if="totalCount > 0"
          variant="subtle"
          size="sm"
        >
          {{ totalCount }}
        </UBadge>
      </header>

      <CommentsLoginNote
        v-if="showLoginNote"
        @login="openAuth"
      />

      <!-- Свёрнутый режим: последний комментарий и кнопка разворачивания -->
      <template v-else-if="!isExpanded">
        <CommentsSkeleton
          v-if="isPreviewLoading"
          :rows="1"
        />

        <UiResult
          v-else-if="loadError"
          status="error"
          title="Не удалось загрузить комментарии"
          :sub-title="loadErrorMessage"
        >
          <template #extra>
            <UButton @click.left.exact.prevent="handleRetry">
              Попробовать снова
            </UButton>
          </template>
        </UiResult>

        <template v-else>
          <button
            v-if="latestComment"
            type="button"
            class="-mx-2 flex cursor-pointer flex-col rounded-lg px-2 py-1 text-left transition-colors hover:bg-elevated"
            @click.left.exact.prevent="handleExpand"
          >
            <CommentsPreviewCard :comment="latestComment" />
          </button>

          <p
            v-else
            class="py-2 text-center text-sm text-muted"
          >
            Пока нет комментариев — начните обсуждение первым.
          </p>

          <UButton
            variant="soft"
            color="neutral"
            block
            icon="tabler:message-circle"
            @click.left.exact.prevent="handleExpand"
          >
            {{ expandButtonLabel }}
          </UButton>
        </template>
      </template>

      <template v-else>
        <CommentsSkeleton v-if="isLoading" />

        <UiResult
          v-else-if="loadError"
          status="error"
          title="Не удалось загрузить комментарии"
          :sub-title="loadErrorMessage"
        >
          <template #extra>
            <UButton @click.left.exact.prevent="handleRetry">
              Попробовать снова
            </UButton>
          </template>
        </UiResult>

        <template v-else>
          <p
            v-if="!hasComments"
            class="py-4 text-center text-sm text-muted"
          >
            Пока нет комментариев — начните обсуждение первым.
          </p>

          <div
            v-else
            ref="commentsList"
            class="flex flex-col gap-6"
          >
            <CommentThread
              v-for="node in rootNodes"
              :key="node.comment.id"
              :node
              :depth="0"
              :actions="treeActions"
              :highlighted-comment-id="highlightedCommentId"
            />
          </div>

          <UButton
            v-if="!isLastPage"
            variant="soft"
            color="neutral"
            block
            :loading="isLoadingMore"
            @click.left.exact.prevent="handleLoadMore"
          >
            Показать ещё
          </UButton>

          <CommentComposer
            placeholder="Поделитесь мнением…"
            :submit-action="submitRootAndReveal"
          />
        </template>
      </template>

      <AuthModal v-model="isAuthOpen" />

      <template #fallback>
        <header class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-highlighted">
            {{ title }}
          </h2>
        </header>

        <CommentsSkeleton />
      </template>
    </ClientOnly>
  </section>
</template>
