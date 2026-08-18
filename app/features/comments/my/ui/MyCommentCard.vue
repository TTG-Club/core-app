<script setup lang="ts">
  import type { MyComment } from '../../model';

  import { useIntersectionObserver, useTimeoutFn } from '@vueuse/core';

  import { NuxtLink } from '#components';

  import { useCommentLocation, useCommentTimestamp } from '../../composables';
  import {
    COMMENT_EDITED_MARK,
    COMMENT_REPLIES_HIDE_LABEL,
    COMMENT_REPLIES_PLURAL_FORMS,
    COMMENT_REPLY_TO_PREFIX,
    MY_COMMENTS_COLLAPSE_LABEL,
    MY_COMMENTS_CONTENT_PREVIEW_LENGTH,
    MY_COMMENTS_EXPAND_LABEL,
    MY_COMMENTS_LAST_REPLY_TITLE,
    MY_COMMENTS_NEW_REPLIES_PLURAL_FORMS,
    MY_COMMENTS_OPEN_LABEL,
    MY_COMMENTS_OPEN_UNAVAILABLE_HINT,
    MY_COMMENTS_READ_DELAY_MS,
  } from '../../model';
  import { useMyCommentReplies } from '../composables';
  import MyCommentReply from './MyCommentReply.vue';

  /** Оформление карточки с непросмотренными ответами. */
  const UPDATED_CARD_CLASS =
    'border-primary/60 bg-default shadow-sm ring-1 ring-primary/25';

  /** Оформление обычной карточки. */
  const CARD_CLASS = 'border-default bg-default shadow-sm';

  /** Иконка метки раздела — она же подсказывает, что метка кликабельна. */
  const SECTION_LINK_ICON = 'tabler:link';

  const props = defineProps<{
    /** Комментарий текущего пользователя */
    comment: MyComment;

    /** Есть ли под ним непросмотренные ответы */
    isUnread: boolean;
  }>();

  const emit = defineEmits<{
    /** Карточку рассмотрели — ответы под ней можно считать просмотренными */
    read: [comment: MyComment];
  }>();

  const cardElement = useTemplateRef<HTMLElement>('cardElement');

  const isContentExpanded = ref(false);

  const {
    replies,
    isExpanded: areRepliesExpanded,
    isLoading: areRepliesLoading,
    toggle: toggleReplies,
  } = useMyCommentReplies(() => props.comment.id);

  const { createdLabel, createdFullLabel, editedTooltip } = useCommentTimestamp(
    () => props.comment,
  );

  /** Оформление карточки: непросмотренные ответы подсвечивают её рамкой. */
  const cardClass = computed(() =>
    props.isUnread ? UPDATED_CARD_CLASS : CARD_CLASS,
  );

  const { sectionLabel, linkToComment } = useCommentLocation(
    () => props.comment,
  );

  /**
   * Метка раздела ведёт на страницу обсуждения. Комментарий без адреса
   * (старые сборки сервиса его не присылали) остаётся просто меткой.
   */
  const sectionLink = computed(() => props.comment.url ?? undefined);

  const sectionBadgeTag = computed(() =>
    sectionLink.value ? NuxtLink : 'span',
  );

  const sectionBadgeIcon = computed(() =>
    sectionLink.value ? SECTION_LINK_ICON : undefined,
  );

  const newRepliesLabel = computed(() => {
    const count = props.comment.newReplyCount;

    return `${count} ${getPlural(count, MY_COMMENTS_NEW_REPLIES_PLURAL_FORMS)}`;
  });

  const repliesToggleLabel = computed(() => {
    if (areRepliesExpanded.value) {
      return COMMENT_REPLIES_HIDE_LABEL;
    }

    const count = props.comment.replyCount;

    return `${count} ${getPlural(count, COMMENT_REPLIES_PLURAL_FORMS)}`;
  });

  const repliesToggleIconClass = computed(() =>
    areRepliesExpanded.value
      ? 'rotate-180 transition-transform'
      : 'transition-transform',
  );

  const canExpandContent = computed(
    () => props.comment.content.length > MY_COMMENTS_CONTENT_PREVIEW_LENGTH,
  );

  // Свёрнутая карточка показывает лишь начало текста: список остаётся
  // просматриваемым, даже когда комментарии длинные.
  const contentClass = computed(() =>
    canExpandContent.value && !isContentExpanded.value ? 'line-clamp-4' : '',
  );

  const contentToggleLabel = computed(() =>
    isContentExpanded.value
      ? MY_COMMENTS_COLLAPSE_LABEL
      : MY_COMMENTS_EXPAND_LABEL,
  );

  /**
   * Куда ведёт кнопка перехода: к самому свежему ответу, если он есть, —
   * именно на него человек и собирается отвечать; иначе к своему комментарию.
   * Без адреса страницы (старые сборки сервиса его не присылали) переходить
   * некуда, и кнопка гаснет.
   */
  const openLink = computed(() => {
    const { lastReply, id } = props.comment;

    return linkToComment(lastReply?.id ?? id);
  });

  /** Подсказка на погашенной кнопке: объясняет, почему переход недоступен. */
  const openHint = computed(() =>
    openLink.value ? undefined : MY_COMMENTS_OPEN_UNAVAILABLE_HINT,
  );

  /** Разворачивает и сворачивает длинный текст своего комментария. */
  function toggleContent(): void {
    isContentExpanded.value = !isContentExpanded.value;
  }

  // Просмотренными ответы считаются, когда карточка задержалась на экране:
  // таймер запускается на входе в зону видимости и сбрасывается, если её
  // пролистали раньше срока.
  const { start: startReadTimer, stop: stopReadTimer } = useTimeoutFn(
    () => {
      emit('read', props.comment);
    },
    MY_COMMENTS_READ_DELAY_MS,
    { immediate: false },
  );

  useIntersectionObserver(cardElement, ([entry]) => {
    if (entry?.isIntersecting) {
      startReadTimer();
    } else {
      stopReadTimer();
    }
  });
</script>

<template>
  <div
    ref="cardElement"
    class="overflow-hidden rounded-xl border transition-colors"
    :class="cardClass"
  >
    <div class="flex flex-col gap-3 p-4">
      <!-- Шапка: где оставлен комментарий, его состояние, дата и переход
        к обсуждению. Метки — одним компонентом и одного размера: ссылка на
        раздел кликабельна, но остаётся такой же меткой, как статус -->
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          :as="sectionBadgeTag"
          :to="sectionLink"
          :icon="sectionBadgeIcon"
          :label="sectionLabel"
          color="neutral"
          variant="subtle"
          size="sm"
        />

        <UBadge
          v-if="isUnread"
          :label="newRepliesLabel"
          color="primary"
          variant="solid"
          size="sm"
        />

        <div class="ml-auto flex items-center gap-2">
          <span
            class="text-xs whitespace-nowrap text-muted tabular-nums"
            :title="createdFullLabel"
          >
            {{ createdLabel }}
          </span>

          <UButton
            :label="MY_COMMENTS_OPEN_LABEL"
            :to="openLink"
            :disabled="!openLink"
            :title="openHint"
            color="primary"
            variant="soft"
            size="xs"
            icon="tabler:arrow-right"
          />
        </div>
      </div>

      <!-- Кому отвечал пользователь -->
      <p
        v-if="comment.parentAuthorName"
        class="text-xs text-muted"
      >
        {{ COMMENT_REPLY_TO_PREFIX }} {{ comment.parentAuthorName }}
      </p>

      <!-- Свой текст -->
      <div class="space-y-1">
        <p
          class="text-sm leading-relaxed break-words whitespace-pre-wrap text-highlighted"
          :class="contentClass"
        >
          {{ comment.content }}
        </p>

        <span
          v-if="comment.editedAt"
          class="text-xs text-muted"
          :title="editedTooltip"
        >
          {{ COMMENT_EDITED_MARK }}
        </span>

        <UButton
          v-if="canExpandContent"
          :label="contentToggleLabel"
          color="neutral"
          variant="ghost"
          size="xs"
          class="-ml-2"
          @click.left.exact.prevent="toggleContent"
        />
      </div>

      <!-- Последний ответ: ради него в раздел и заходят. В раскрытой ветке он
        и так стоит последним — второй раз показывать его незачем -->
      <div
        v-if="comment.lastReply && !areRepliesExpanded"
        class="rounded-r-xl border-l-4 border-primary/60 bg-elevated py-2.5 pr-3 pl-4"
      >
        <div class="flex items-center gap-1.5 text-xs font-medium text-primary">
          <UIcon
            name="tabler:corner-down-right"
            class="size-4 shrink-0"
            aria-hidden="true"
          />

          <span>{{ MY_COMMENTS_LAST_REPLY_TITLE }}</span>
        </div>

        <MyCommentReply
          class="mt-1.5"
          :author-name="comment.lastReply.authorName"
          :content="comment.lastReply.content"
          :created-at="comment.lastReply.createdAt"
        />
      </div>

      <!-- Вся ветка ответов. Строка появляется только там, где есть что
        раскрывать: у комментария без ответов она была бы пустой -->
      <UButton
        v-if="comment.replyCount > 0"
        :label="repliesToggleLabel"
        :loading="areRepliesLoading"
        color="neutral"
        variant="ghost"
        size="xs"
        trailing-icon="tabler:chevron-down"
        class="-ml-2 self-start"
        :ui="{ trailingIcon: repliesToggleIconClass }"
        @click.left.exact.prevent="toggleReplies"
      />

      <!-- Раскрытая ветка: кто ещё отвечал на этот комментарий -->
      <div
        v-if="areRepliesExpanded && replies.length > 0"
        class="space-y-3 border-t border-default pt-3"
      >
        <div
          v-for="reply in replies"
          :key="reply.id"
          class="flex flex-wrap items-start justify-between gap-2"
        >
          <MyCommentReply
            class="min-w-0 flex-1"
            :author-name="reply.authorName"
            :content="reply.content"
            :created-at="reply.createdAt"
          />

          <UButton
            v-if="comment.url"
            :to="linkToComment(reply.id)"
            icon="tabler:arrow-right"
            :aria-label="MY_COMMENTS_OPEN_LABEL"
            :title="MY_COMMENTS_OPEN_LABEL"
            color="neutral"
            variant="ghost"
            size="xs"
          />
        </div>
      </div>
    </div>
  </div>
</template>
