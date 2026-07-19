<script setup lang="ts">
  import type { CommentTreeActions } from '../model';

  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { UiResult } from '~ui/result';
  import { AuthModal } from '~user/auth-modal';

  import { useCommentsSection } from '../composables';
  import {
    COMMENT_ANCHOR_PREFIX,
    COMMENT_COMPOSER_ROOT_PLACEHOLDER,
    COMMENT_HIGHLIGHT_DURATION_MS,
    COMMENTS_EMPTY_MESSAGE,
    COMMENTS_EXPAND_EMPTY_GUEST_LABEL,
    COMMENTS_EXPAND_EMPTY_LABEL,
    COMMENTS_EXPAND_PREFIX,
    COMMENTS_LOAD_ERROR_TOAST,
    COMMENTS_LOAD_MORE_LABEL,
    COMMENTS_PLURAL_FORMS,
    COMMENTS_PREVIEW_UNAVAILABLE,
    COMMENTS_RETRY_LABEL,
    COMMENTS_SECTION_TITLE,
    getCommentAnchorId,
    getCommentErrorMessage,
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
    title = COMMENTS_SECTION_TITLE,
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
   * Читать обсуждение можно и без сессии — от неё зависит только право
   * писать: комментарий, ответ, правку и жалобу сервис требует авторизовать.
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
    restoreTombstone,
    submitReport,
    isOwnComment,
    isCommentReported,
  } = useCommentsSection({ section, url });

  const treeActions: CommentTreeActions = {
    toggleReplies,
    submitReply,
    submitEdit,
    removeComment,
    restoreTombstone,
    submitReport,
    isOwnComment,
    isCommentReported,
    canComment,
    highlightComment,
    getCommentLink,
  };

  /**
   * Право писать: гостю не показываются ответ, правка и жалоба — сервис
   * отвечает на них 401. Читать обсуждение можно и без входа.
   */
  function canComment(): boolean {
    return hasSession.value;
  }

  /**
   * Абсолютная якорная ссылка на комментарий. Строится от канонического
   * адреса обсуждения, а не от текущего: в дровере и широкой панели адрес
   * вкладки — это список, и ссылка с него не привела бы к комментарию.
   */
  function getCommentLink(commentId: string): string {
    return `${getOrigin()}${url}#${getCommentAnchorId(commentId)}`;
  }

  const hasComments = computed(() => rootNodes.value.length > 0);

  /**
   * У страницы нет ни одного опубликованного комментария. Считаем по
   * серверному счётчику, а не по превью: превью может не собраться и при
   * живом обсуждении (сверху ленты одни надгробия).
   */
  const isThreadEmpty = computed(() => totalCount.value === 0);

  /**
   * Гость на пустом обсуждении: разворачивать нечего, а единственное, что ему
   * тут доступно, — войти и начать разговор. Кнопка свёрнутого блока в этом
   * случае и подписана, и работает как вход.
   */
  const isGuestOnEmptyThread = computed(
    () => !hasSession.value && isThreadEmpty.value,
  );

  /** Подпись кнопки разворачивания свёрнутого блока. */
  const expandButtonLabel = computed(() => {
    if (totalCount.value > 0) {
      return `${COMMENTS_EXPAND_PREFIX} ${totalCount.value} ${getPlural(totalCount.value, COMMENTS_PLURAL_FORMS)}`;
    }

    return isGuestOnEmptyThread.value
      ? COMMENTS_EXPAND_EMPTY_GUEST_LABEL
      : COMMENTS_EXPAND_EMPTY_LABEL;
  });

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

  /**
   * Клик по кнопке свёрнутого блока. Гостю на пустом обсуждении она ведёт
   * сразу в окно входа: разворачивать нечего, а подпись обещает вход.
   */
  function handleExpand(): void {
    if (isGuestOnEmptyThread.value) {
      openAuth();

      return;
    }

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
   * Первичная загрузка. Обсуждение читают все, включая гостей, — вход нужен
   * только чтобы писать. Профиль при живой сессии тянем принудительно: свой
   * `id` нужен для сравнения с `authorId` (кнопки правки и удаления). Без
   * якоря в адресе блок стартует свёрнутым — грузится только превью.
   */
  async function initializeComments(): Promise<void> {
    if (isInitialized.value) {
      return;
    }

    isInitialized.value = true;

    if (hasSession.value && !isLoggedIn.value) {
      void fetchProfile();
    }

    if (hasCommentAnchor()) {
      await expandAndReveal();

      return;
    }

    await loadPreview();
  }

  onMounted(initializeComments);

  // Вход и выход меняют куку: и через общую модалку в шлеме сайта (там
  // меняется isLoggedIn), и через локальное окно (там о конце входа говорит
  // закрытие). Ленту это не трогает — гостю и авторизованному сервис отдаёт
  // одно и то же, меняется только право писать. За него отвечает hasSession,
  // а он читает кэш куки: без сброса кэш помнит состояние на момент гидрации,
  // и форма отправки не сменилась бы приглашением войти (и наоборот).
  // Цикла нет: вотчер меняет только кэш куки, на источники он не влияет.
  watch([isLoggedIn, isAuthOpen], () => {
    refreshCookie(USER_TOKEN_COOKIE);
  });

  function openAuth(): void {
    isAuthOpen.value = true;
  }

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

      <!-- Свёрнутый режим: последний комментарий и кнопка разворачивания -->
      <template v-if="!isExpanded">
        <CommentsSkeleton
          v-if="isPreviewLoading"
          :rows="1"
        />

        <UiResult
          v-else-if="loadError"
          status="error"
          :title="COMMENTS_LOAD_ERROR_TOAST"
          :sub-title="loadErrorMessage"
        >
          <template #extra>
            <UButton @click.left.exact.prevent="handleRetry">
              {{ COMMENTS_RETRY_LABEL }}
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

          <!--
            Отсутствие превью ещё не значит отсутствия обсуждения: сверху
            ленты могут стоять надгробия, из которых карточку не собрать.
            Пустоту утверждаем только по серверному счётчику.
          -->
          <p
            v-else-if="isThreadEmpty"
            class="py-2 text-center text-sm text-muted"
          >
            {{ COMMENTS_EMPTY_MESSAGE }}
          </p>

          <p
            v-else
            class="py-2 text-center text-sm text-muted"
          >
            {{ COMMENTS_PREVIEW_UNAVAILABLE }}
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
          :title="COMMENTS_LOAD_ERROR_TOAST"
          :sub-title="loadErrorMessage"
        >
          <template #extra>
            <UButton @click.left.exact.prevent="handleRetry">
              {{ COMMENTS_RETRY_LABEL }}
            </UButton>
          </template>
        </UiResult>

        <template v-else>
          <p
            v-if="!hasComments"
            class="py-4 text-center text-sm text-muted"
          >
            {{ COMMENTS_EMPTY_MESSAGE }}
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
            {{ COMMENTS_LOAD_MORE_LABEL }}
          </UButton>

          <!--
            Гостю на месте формы — приглашение войти: читать обсуждение может
            любой, отправлять комментарии — только авторизованный.
          -->
          <CommentComposer
            v-if="hasSession"
            :placeholder="COMMENT_COMPOSER_ROOT_PLACEHOLDER"
            :submit-action="submitRootAndReveal"
          />

          <CommentsLoginNote
            v-else
            @login="openAuth"
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
