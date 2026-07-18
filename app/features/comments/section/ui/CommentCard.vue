<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { CommentNode, CommentTreeActions } from '../../model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useCommentTimestamp } from '../../composables';
  import {
    COMMENT_REPLIES_PLURAL_FORMS,
    countCommentDescendants,
    getCommentAnchorId,
    hasServerReplyTotal,
  } from '../../model';
  import CommentComposer from './CommentComposer.vue';

  const {
    node,
    actions,
    highlightedCommentId = null,
  } = defineProps<{
    node: CommentNode;
    actions: CommentTreeActions;
    /** Комментарий, подсвеченный после перехода по якорной ссылке. */
    highlightedCommentId?: string | null;
  }>();

  const { copy } = useCopyAndShare();

  const { createdLabel, createdFullLabel, editedTooltip } = useCommentTimestamp(
    () => node.comment,
  );

  /** DOM-якорь карточки — для ссылок вида `#comment-<id>`. */
  const anchorId = computed(() => getCommentAnchorId(node.comment.id));

  /**
   * Подсветка перехода по якорю: фон появляется мгновенно, а при снятии
   * подсветки навешивается переход — фон плавно угасает.
   */
  const highlightClass = computed(() =>
    highlightedCommentId === node.comment.id
      ? 'bg-elevated'
      : 'bg-transparent transition-colors duration-1000',
  );

  const isReplyOpen = ref(false);
  const isEditOpen = ref(false);
  const isDeleteOpen = ref(false);
  const isDeleting = ref(false);

  const isOwn = computed(() => actions.isOwnComment(node));

  const { canModerateComments } = useUserRoles();

  /**
   * Правка и удаление доступны автору, модераторам и администраторам
   * (те же правила проверяет и сам сервис).
   */
  const canManageComment = computed(
    () => isOwn.value || canModerateComments.value,
  );

  const isReported = computed(() => actions.isCommentReported(node.comment.id));

  /** Подпись «кому ответили» видна на каждом ответе. */
  const showReplyTo = computed(() => !!node.replyToName);

  const deleteDescription = computed(() =>
    node.comment.replyCount > 0
      ? 'Ответы этой ветки тоже перестанут отображаться.'
      : 'Действие нельзя отменить.',
  );

  /**
   * Все потомки ветки (включая ответы на ответы). До загрузки ветки сервис
   * сообщает только прямых детей — после первой загрузки число уточняется.
   */
  const repliesTotal = computed(() => countCommentDescendants(node));

  /**
   * Кнопка ответов рядом с «Ответить»: догрузка ещё не загруженной ветки
   * (в том числе хвоста за предохранителем глубины) либо свёртка/развёртка
   * уже загруженной — доступна на любом уровне вложенности.
   */
  const showRepliesToggle = computed(() => repliesTotal.value > 0);

  const repliesToggleLabel = computed(() => {
    if (node.repliesLoaded && node.repliesExpanded) {
      return 'Скрыть ответы';
    }

    // Точное число известно из загруженной ветки либо из серверного
    // totalReplyCount; старые сборки сервиса его не присылают — тогда до
    // загрузки ветки число не показываем, чтобы не врать (replyCount
    // считает только прямых детей).
    if (node.repliesLoaded || hasServerReplyTotal(node.comment)) {
      return `${repliesTotal.value} ${getPlural(repliesTotal.value, COMMENT_REPLIES_PLURAL_FORMS)}`;
    }

    return 'Показать ответы';
  });

  const repliesToggleIcon = computed(() =>
    node.repliesLoaded && node.repliesExpanded
      ? 'tabler:chevron-up'
      : 'tabler:chevron-down',
  );

  function handleToggleReplies(): void {
    void actions.toggleReplies(node);
  }

  /** Действие карточки: пункт меню «⋯» на сенсорных, иконка-кнопка с мышью. */
  interface CommentCardAction {
    key: string;
    label: string;
    icon: string;
    color?: 'error';
    disabled?: boolean;
    handler?: () => void;
  }

  /** Доступные действия карточки — общий источник для меню и ряда иконок. */
  const cardActions = computed<Array<CommentCardAction>>(() => {
    const availableActions: Array<CommentCardAction> = [
      {
        key: 'copy-link',
        label: 'Скопировать ссылку',
        icon: 'tabler:link',
        handler: copyCommentLink,
      },
    ];

    if (node.comment.parentId) {
      availableActions.push({
        key: 'show-parent',
        label: 'Показать родительский',
        icon: 'tabler:corner-left-up',
        handler: showParentComment,
      });
    }

    if (canManageComment.value) {
      availableActions.push(
        {
          key: 'edit',
          label: 'Редактировать',
          icon: 'tabler:pencil',
          handler: openEdit,
        },
        {
          key: 'delete',
          label: 'Удалить',
          icon: 'tabler:trash',
          color: 'error',
          handler: openDelete,
        },
      );

      return availableActions;
    }

    if (isReported.value) {
      availableActions.push({
        key: 'reported',
        label: 'Жалоба отправлена',
        icon: 'tabler:flag',
        disabled: true,
      });

      return availableActions;
    }

    availableActions.push({
      key: 'report',
      label: 'Пожаловаться',
      icon: 'tabler:flag',
      color: 'error',
      handler: handleReport,
    });

    return availableActions;
  });

  const menuItems = computed<Array<DropdownMenuItem>>(() =>
    cardActions.value.map((action) => ({
      label: action.label,
      icon: action.icon,
      color: action.color,
      disabled: action.disabled,
      onSelect: action.handler,
    })),
  );

  /** Цвет иконки-кнопки действия (деструктивные — красные). */
  function getCardActionColor(action: CommentCardAction): 'error' | 'neutral' {
    return action.color ?? 'neutral';
  }

  /** Запускает действие карточки из ряда иконок. */
  function runCardAction(action: CommentCardAction): void {
    action.handler?.();
  }

  /**
   * Скроллит к родительскому комментарию и коротко подсвечивает его —
   * родитель видимого ответа всегда отрисован (его ветка раскрыта).
   */
  function showParentComment(): void {
    const { parentId } = node.comment;

    if (parentId) {
      actions.highlightComment(parentId);
    }
  }

  /**
   * Копирует якорную ссылку на комментарий — на каноническую страницу
   * обсуждения (в дровере и широкой панели текущий адрес — это список).
   * Об успехе и ошибке сообщает тост внутри `useCopyAndShare`.
   */
  function copyCommentLink(): void {
    void copy(actions.getCommentLink(node.comment.id));
  }

  function openEdit(): void {
    isEditOpen.value = true;
    isReplyOpen.value = false;
  }

  function closeEdit(): void {
    isEditOpen.value = false;
  }

  function openDelete(): void {
    isDeleteOpen.value = true;
  }

  function toggleReply(): void {
    isReplyOpen.value = !isReplyOpen.value;
    isEditOpen.value = false;
  }

  function closeReply(): void {
    isReplyOpen.value = false;
  }

  function handleReport(): void {
    void actions.submitReport(node);
  }

  async function confirmDelete(): Promise<void> {
    isDeleting.value = true;

    try {
      const success = await actions.removeComment(node);

      if (success) {
        isDeleteOpen.value = false;
      }
    } finally {
      isDeleting.value = false;
    }
  }

  function submitReplyAction(content: string): Promise<boolean> {
    return actions.submitReply(node, content);
  }

  function submitEditAction(content: string): Promise<boolean> {
    return actions.submitEdit(node, content);
  }
</script>

<template>
  <article
    :id="anchorId"
    class="group/comment -mx-2 flex scroll-mt-24 flex-col gap-1.5 rounded-lg px-2"
    :class="highlightClass"
  >
    <!-- На узких экранах мета-блок (бейдж, время, меню) уходит под имя -->
    <header class="flex items-start gap-2 sm:items-center">
      <UAvatar
        :alt="node.comment.authorName"
        size="xs"
        class="shrink-0"
        :ui="{ fallback: 'uppercase' }"
      />

      <div
        class="flex min-w-0 flex-1 flex-col gap-y-1 sm:flex-row sm:items-center sm:gap-x-2"
      >
        <span class="min-w-0 truncate text-sm/6 font-semibold text-highlighted">
          {{ node.comment.authorName }}
        </span>

        <div class="flex min-w-0 items-center gap-2">
          <UBadge
            v-if="isOwn"
            variant="subtle"
            size="sm"
          >
            Вы
          </UBadge>

          <UTooltip
            v-if="createdLabel"
            :text="createdFullLabel"
          >
            <time
              class="text-xs whitespace-nowrap text-muted"
              :datetime="node.comment.createdAt"
            >
              {{ createdLabel }}
            </time>
          </UTooltip>

          <UTooltip
            v-if="node.comment.editedAt"
            :text="editedTooltip"
          >
            <span class="text-xs text-dimmed">(изменено)</span>
          </UTooltip>

          <!--
            С мышью (точный указатель) действия — ряд иконок с тултипами,
            проявляющийся при наведении на карточку (и при фокусе с клавиатуры).
            На сенсорных экранах ховера нет — там остаётся меню «⋯».
          -->
          <div
            class="hidden items-center gap-0.5 opacity-0 transition-opacity group-hover/comment:opacity-100 focus-within:opacity-100 pointer-fine:flex"
          >
            <UTooltip
              v-for="action in cardActions"
              :key="action.key"
              :text="action.label"
            >
              <UButton
                :icon="action.icon"
                variant="ghost"
                :color="getCardActionColor(action)"
                size="xs"
                :disabled="action.disabled"
                :aria-label="action.label"
                @click.left.exact.prevent="runCardAction(action)"
              />
            </UTooltip>
          </div>

          <UDropdownMenu :items="menuItems">
            <UButton
              icon="tabler:dots-vertical"
              variant="ghost"
              color="neutral"
              size="xs"
              aria-label="Действия с комментарием"
              class="pointer-fine:hidden"
            />
          </UDropdownMenu>
        </div>
      </div>
    </header>

    <p
      v-if="showReplyTo"
      class="flex items-center gap-1 text-xs text-muted"
    >
      <UIcon
        name="tabler:arrow-back-up"
        class="size-3.5 shrink-0"
      />
      в ответ {{ node.replyToName }}
    </p>

    <!-- Контент рендерится текстом: сервис не санитизирует ввод -->
    <p
      v-if="!isEditOpen"
      class="text-sm wrap-break-word whitespace-pre-line text-default"
    >
      {{ node.comment.content }}
    </p>

    <CommentComposer
      v-else
      :initial-content="node.comment.content"
      placeholder="Текст комментария"
      submit-label="Сохранить"
      cancellable
      autofocus
      :with-cooldown="false"
      :submit-action="submitEditAction"
      @done="closeEdit"
      @cancel="closeEdit"
    />

    <footer
      v-if="!isEditOpen"
      class="-ml-2 flex flex-wrap items-center gap-1"
    >
      <!-- ml-1.25 ставит иконку-стрелку на ось линии ветки (центр аватара) -->
      <UButton
        v-if="showRepliesToggle"
        variant="ghost"
        size="xs"
        class="ml-1.25"
        :icon="repliesToggleIcon"
        :loading="node.repliesLoading"
        @click.left.exact.prevent="handleToggleReplies"
      >
        {{ repliesToggleLabel }}
      </UButton>

      <UButton
        variant="ghost"
        color="neutral"
        size="xs"
        icon="tabler:arrow-back-up"
        @click.left.exact.prevent="toggleReply"
      >
        Ответить
      </UButton>
    </footer>

    <CommentComposer
      v-if="isReplyOpen"
      :placeholder="`Ответ для ${node.comment.authorName}`"
      submit-label="Ответить"
      cancellable
      autofocus
      :submit-action="submitReplyAction"
      @done="closeReply"
      @cancel="closeReply"
    />

    <ConfirmDialog
      v-model:open="isDeleteOpen"
      title="Удалить комментарий?"
      :description="deleteDescription"
      confirm-label="Удалить"
      confirm-color="error"
      confirm-icon="tabler:trash"
      :loading="isDeleting"
      @confirm="confirmDelete"
    />
  </article>
</template>
