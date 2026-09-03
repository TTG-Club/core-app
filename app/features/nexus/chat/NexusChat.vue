<script setup lang="ts">
  import type { SharedSheetText } from '~character-sheet/composables';
  import type { BroadcastRoll } from '~dice-roller/composables';

  import type { ChatFeedEvent } from '../model';

  import { useSheetTextSink } from '~character-sheet/composables';
  import { useDiceRollSink } from '~dice-roller/composables';
  import { useParticipantNames } from '~find-game/composables';
  import { UiResult } from '~ui/result';

  import { useNexusChat } from '../composables';
  import {
    CHAT_AUTOSCROLL_THRESHOLD_PX,
    CHAT_EMPTY_DESCRIPTION,
    CHAT_EMPTY_TITLE,
    CHAT_LOAD_OLDER_LABEL,
    CHAT_UNREAD_PREFIX,
    NEXUS_CHAT_TITLE,
    toSheetChatMessage,
  } from '../model';
  import { ChatComposer, ChatConnectionBadge, NexusChatMessage } from './ui';

  /**
   * Чат комнаты: история, живая лента и форма отправки.
   *
   * Лента прижата к низу и держится там сама, пока человек не ушёл читать
   * историю вверх: новое сообщение не должно выдёргивать из чтения.
   */
  const { nexusId, currentUserId } = defineProps<{
    nexusId: string;
    /** Кто читает: своё сообщение выделяется рамкой. */
    currentUserId: string | null;
  }>();

  const container = ref<HTMLElement | null>(null);
  const isAtBottom = ref(true);

  const {
    connectionStatus,
    events,
    hasMoreHistory,
    historyError,
    isConnectionExhausted,
    isLoadingHistory,
    isLoadingOlder,
    loadOlder,
    markRead,
    reconnect,
    retry,
    sendDiceRoll,
    sendRolled,
    sendText,
    unreadCount,
  } = useNexusChat({
    nexusId: () => nexusId,
    enabled: () => true,
    authorId: () => currentUserId,
    isAtBottom: () => isAtBottom.value,
  });

  const { getParticipantName, resolveNames } = useParticipantNames();

  const { clearSink, setSink } = useDiceRollSink();

  const { clearSink: clearTextSink, setSink: setTextSink } = useSheetTextSink();

  /**
   * Бросок, сделанный вне поля ввода — с листа персонажа, из таблицы или
   * роллера, — уходит в ленту: за столом такой бросок видят все.
   * @param roll Готовый бросок.
   */
  function sink(roll: BroadcastRoll) {
    void sendRolled(
      {
        expression: roll.notation,
        total: roll.total,
        subject: roll.subject,
        groups: roll.details.map((detail) => ({
          label: detail.label,
          rolls: detail.rolls.map((die) => ({
            value: die.value,
            valid: die.valid,
            critical: die.critical ?? null,
          })),
        })),
      },
      roll.label,
    );
  }

  /**
   * Текст с листа персонажа — особенность, заклинание. За столом такое
   * зачитывают вслух; здесь оно уходит сообщением, чтобы группа прочитала сама.
   *
   * @param shared Название и текст.
   */
  function textSink(shared: SharedSheetText) {
    void sendText(toSheetChatMessage(shared.title, shared.text));
  }

  // Приёмники живут, пока открыта комната: вне её с листа никуда ничего не
  // уходит.
  onMounted(() => {
    setSink(sink);
    setTextSink(textSink);
  });

  onUnmounted(() => {
    clearSink(sink);
    clearTextSink(textSink);
  });

  const isEmpty = computed(
    () => !isLoadingHistory.value && !events.value.length,
  );

  // Имена авторов живут в core-api: сервис комнат знает только идентификаторы.
  watch(
    events,
    (list) => {
      void resolveNames(list.map((event) => event.authorId));
    },
    { immediate: true },
  );

  /** Дотягивает ленту до низа. */
  function scrollToBottom(behavior: 'auto' | 'smooth' = 'smooth'): void {
    const element = container.value;

    if (element) {
      element.scrollTo({ top: element.scrollHeight, behavior });
    }
  }

  /** Следит, остаётся ли читатель у нижнего края. */
  function handleScroll(): void {
    const element = container.value;

    if (!element) {
      return;
    }

    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    isAtBottom.value = distance <= CHAT_AUTOSCROLL_THRESHOLD_PX;

    if (isAtBottom.value) {
      markRead();
    }
  }

  // Новое событие дотягивает ленту вниз только для того, кто и так внизу:
  // ушедшего читать историю прокрутка выдернула бы с места.
  watch(
    () => events.value.length,
    async () => {
      if (!isAtBottom.value) {
        return;
      }

      await nextTick();
      scrollToBottom('auto');
    },
  );

  /** Возвращает к последним сообщениям и гасит счётчик непрочитанных. */
  async function goToLatest(): Promise<void> {
    isAtBottom.value = true;
    markRead();

    await nextTick();
    scrollToBottom();
  }

  /**
   * Повторяет неудавшуюся отправку.
   * @param event Событие ленты с ошибкой.
   */
  function handleRetry(event: ChatFeedEvent): void {
    void retry(event);
  }
</script>

<template>
  <section class="flex h-full min-h-0 flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-lg font-semibold text-highlighted">
        {{ NEXUS_CHAT_TITLE }}
      </h3>

      <ChatConnectionBadge
        :status="connectionStatus"
        :can-reconnect="isConnectionExhausted"
        @reconnect="reconnect"
      />
    </div>

    <div
      class="flex min-h-96 flex-1 flex-col overflow-hidden rounded-lg border border-default"
    >
      <div
        ref="container"
        class="flex flex-1 flex-col overflow-y-auto px-3 py-3"
        @scroll="handleScroll"
      >
        <!-- Спейсер прижимает короткую ленту к низу: разговор читают снизу -->
        <div class="mt-auto" />

        <div class="flex flex-col gap-3">
          <div
            v-if="isLoadingHistory"
            class="flex flex-col gap-2"
          >
            <USkeleton
              v-for="index in 3"
              :key="index"
              class="h-16 w-full rounded-xl"
            />
          </div>

          <UButton
            v-else-if="hasMoreHistory"
            size="sm"
            color="neutral"
            variant="subtle"
            class="self-center"
            :loading="isLoadingOlder"
            :label="CHAT_LOAD_OLDER_LABEL"
            @click.left.exact.prevent="loadOlder"
          />

          <UiResult
            v-if="isEmpty"
            status="info"
            :title="CHAT_EMPTY_TITLE"
            :sub-title="CHAT_EMPTY_DESCRIPTION"
          />

          <NexusChatMessage
            v-for="event in events"
            :key="event.id"
            :event="event"
            :author-name="getParticipantName(event.authorId)"
            :is-own="event.authorId === currentUserId"
            @retry="handleRetry"
          />
        </div>
      </div>

      <!-- Пока читают историю, новые сообщения ждут внизу счётчиком -->
      <UButton
        v-if="unreadCount > 0"
        size="sm"
        color="primary"
        variant="subtle"
        icon="tabler:arrow-down"
        class="mx-3 mb-2 self-center"
        :label="`${CHAT_UNREAD_PREFIX}: ${unreadCount}`"
        @click.left.exact.prevent="goToLatest"
      />

      <div class="border-t border-default p-3">
        <ChatComposer
          @send-text="sendText"
          @send-dice="sendDiceRoll"
        />
      </div>
    </div>

    <p
      v-if="historyError"
      class="text-sm text-error"
    >
      {{ historyError }}
    </p>
  </section>
</template>
