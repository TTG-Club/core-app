<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { CommentNode, CommentTreeActions } from '../../model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useCommentTimestamp } from '../../composables';
  import {
    COMMENT_ACTIONS_MENU_LABEL,
    COMMENT_COPY_LINK_LABEL,
    COMMENT_DELETE_BRANCH_WARNING,
    COMMENT_DELETE_CONFIRM_LABEL,
    COMMENT_DELETE_DIALOG_TITLE,
    COMMENT_DELETE_IRREVERSIBLE_WARNING,
    COMMENT_DELETE_MENU_LABEL,
    COMMENT_EDIT_LABEL,
    COMMENT_EDIT_PLACEHOLDER,
    COMMENT_EDIT_SUBMIT_LABEL,
    COMMENT_EDITED_MARK,
    COMMENT_OWN_BADGE_LABEL,
    COMMENT_REPLIES_HIDE_LABEL,
    COMMENT_REPLIES_PLURAL_FORMS,
    COMMENT_REPLIES_SHOW_LABEL,
    COMMENT_REPLY_LABEL,
    COMMENT_REPLY_PLACEHOLDER_PREFIX,
    COMMENT_REPLY_TO_PREFIX,
    COMMENT_REPORT_LABEL,
    COMMENT_REPORTED_LABEL,
    COMMENT_SHOW_PARENT_LABEL,
    COMMENT_TOMBSTONE_TEXT,
    countCommentDescendants,
    getCommentAnchorId,
    hasServerReplyTotal,
    isCommentTombstone,
  } from '../../model';
  import CommentComposer from './CommentComposer.vue';
  import CommentTombstone from './CommentTombstone.vue';

  const {
    node,
    actions,
    replyToName = null,
    highlightedCommentId = null,
  } = defineProps<{
    node: CommentNode;
    actions: CommentTreeActions;
    /** Имя автора родителя — приходит от ветки, см. `CommentThread`. */
    replyToName?: string | null;
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

  /**
   * Комментарий с содержимым; `null` — это надгробие, и вместо карточки
   * рисуется заглушка (`CommentTombstone`). Автора и текста у неё нет, а
   * ответ, жалоба и правка по ней возвращают 409 — поэтому действия
   * скрываются, а не гасятся ошибкой с бэка.
   */
  const publishedComment = computed(() =>
    isCommentTombstone(node.comment) ? null : node.comment,
  );

  const isTombstone = computed(() => !publishedComment.value);

  /**
   * Доступное имя карточки. Обычную называет автор и текст внутри, а у
   * заглушки их нет — без явного имени она осталась бы в дереве доступности
   * безымянным `article`.
   */
  const articleLabel = computed(() =>
    isTombstone.value ? COMMENT_TOMBSTONE_TEXT : undefined,
  );

  /**
   * Подсказка в форме ответа — адресует автору, которому отвечают. Собирается
   * только при живом комментарии: опциональная цепочка внутри шаблонной строки
   * дала бы литеральное «Ответ для undefined».
   */
  const replyPlaceholder = computed(() =>
    publishedComment.value
      ? `${COMMENT_REPLY_PLACEHOLDER_PREFIX} ${publishedComment.value.authorName}`
      : '',
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

  /**
   * Имя автора, которому отвечает комментарий. Берём из ветки, а при её
   * отсутствии (узел без отрисованного родителя) — из серверного
   * `parentAuthorName`. У ответа на надгробие имени нет: сервис его не
   * раскрывает, пока родителя не восстановят.
   */
  const replyToAuthorName = computed(
    () => replyToName ?? node.comment.parentAuthorName,
  );

  /** Подпись «кому ответили» видна на каждом ответе. */
  const showReplyTo = computed(() => !!replyToAuthorName.value);

  const deleteDescription = computed(() =>
    node.comment.replyCount > 0
      ? COMMENT_DELETE_BRANCH_WARNING
      : COMMENT_DELETE_IRREVERSIBLE_WARNING,
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
      return COMMENT_REPLIES_HIDE_LABEL;
    }

    // Точное число известно из загруженной ветки либо из серверного
    // totalReplyCount; старые сборки сервиса его не присылают — тогда до
    // загрузки ветки число не показываем, чтобы не врать (replyCount
    // считает только прямых детей).
    if (node.repliesLoaded || hasServerReplyTotal(node.comment)) {
      return `${repliesTotal.value} ${getPlural(repliesTotal.value, COMMENT_REPLIES_PLURAL_FORMS)}`;
    }

    return COMMENT_REPLIES_SHOW_LABEL;
  });

  const repliesToggleIcon = computed(() =>
    node.repliesLoaded && node.repliesExpanded
      ? 'tabler:chevron-up'
      : 'tabler:chevron-down',
  );

  /**
   * Ряд действий под карточкой. У надгробия он сводится к кнопке ветки
   * (отвечать самой заглушке нельзя), у обычной карточки прячется на время
   * правки — форма занимает его место.
   */
  const showFooter = computed(() =>
    isTombstone.value ? showRepliesToggle.value : !isEditOpen.value,
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
        label: COMMENT_COPY_LINK_LABEL,
        icon: 'tabler:link',
        handler: copyCommentLink,
      },
    ];

    if (node.comment.parentId) {
      availableActions.push({
        key: 'show-parent',
        label: COMMENT_SHOW_PARENT_LABEL,
        icon: 'tabler:corner-left-up',
        handler: showParentComment,
      });
    }

    if (canManageComment.value) {
      availableActions.push(
        {
          key: 'edit',
          label: COMMENT_EDIT_LABEL,
          icon: 'tabler:pencil',
          handler: openEdit,
        },
        {
          key: 'delete',
          label: COMMENT_DELETE_MENU_LABEL,
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
        label: COMMENT_REPORTED_LABEL,
        icon: 'tabler:flag',
        disabled: true,
      });

      return availableActions;
    }

    availableActions.push({
      key: 'report',
      label: COMMENT_REPORT_LABEL,
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
    :aria-label="articleLabel"
  >
    <CommentTombstone
      v-if="isTombstone"
      :node
      :actions
      :reply-to-name="replyToName"
    />

    <template v-else>
      <!-- На узких экранах мета-блок (бейдж, время, меню) уходит под имя -->
      <header class="flex items-start gap-2 sm:items-center">
        <UAvatar
          :alt="publishedComment?.authorName"
          size="xs"
          class="shrink-0"
          :ui="{ fallback: 'uppercase' }"
        />

        <div
          class="flex min-w-0 flex-1 flex-col gap-y-1 sm:flex-row sm:items-center sm:gap-x-2"
        >
          <span
            class="min-w-0 truncate text-sm/6 font-semibold text-highlighted"
          >
            {{ publishedComment?.authorName }}
          </span>

          <div class="flex min-w-0 items-center gap-2">
            <UBadge
              v-if="isOwn"
              variant="subtle"
              size="sm"
            >
              {{ COMMENT_OWN_BADGE_LABEL }}
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
              <span class="text-xs text-dimmed">{{ COMMENT_EDITED_MARK }}</span>
            </UTooltip>

            <!--
              С мышью (точный указатель) действия — ряд иконок с тултипами,
              проявляющийся при наведении на карточку (и при фокусе
              с клавиатуры). На сенсорных экранах ховера нет — там остаётся
              меню «⋯».
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
                :aria-label="COMMENT_ACTIONS_MENU_LABEL"
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
          aria-hidden="true"
        />
        {{ COMMENT_REPLY_TO_PREFIX }} {{ replyToAuthorName }}
      </p>

      <!-- Контент рендерится текстом: сервис не санитизирует ввод -->
      <p
        v-if="!isEditOpen"
        class="text-sm wrap-break-word whitespace-pre-line text-default"
      >
        {{ publishedComment?.content }}
      </p>

      <CommentComposer
        v-else
        :initial-content="publishedComment?.content"
        :placeholder="COMMENT_EDIT_PLACEHOLDER"
        :submit-label="COMMENT_EDIT_SUBMIT_LABEL"
        cancellable
        autofocus
        :with-cooldown="false"
        :submit-action="submitEditAction"
        @done="closeEdit"
        @cancel="closeEdit"
      />
    </template>

    <footer
      v-if="showFooter"
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
        v-if="!isTombstone"
        variant="ghost"
        color="neutral"
        size="xs"
        icon="tabler:arrow-back-up"
        @click.left.exact.prevent="toggleReply"
      >
        {{ COMMENT_REPLY_LABEL }}
      </UButton>
    </footer>

    <!--
      Форма могла остаться открытой с того момента, когда комментарий был
      живым: фоновая пересборка ветки сохраняет инстанс карточки (ключ — id),
      а сам комментарий подменяет надгробием.
    -->
    <CommentComposer
      v-if="isReplyOpen && !isTombstone"
      :placeholder="replyPlaceholder"
      :submit-label="COMMENT_REPLY_LABEL"
      cancellable
      autofocus
      :submit-action="submitReplyAction"
      @done="closeReply"
      @cancel="closeReply"
    />

    <ConfirmDialog
      v-model:open="isDeleteOpen"
      :title="COMMENT_DELETE_DIALOG_TITLE"
      :description="deleteDescription"
      :confirm-label="COMMENT_DELETE_CONFIRM_LABEL"
      confirm-color="error"
      confirm-icon="tabler:trash"
      :loading="isDeleting"
      @confirm="confirmDelete"
    />
  </article>
</template>
