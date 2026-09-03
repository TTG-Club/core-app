<script setup lang="ts">
  import { useNexusDice } from '../../composables';
  import {
    CHAT_DICE_QUICK_HINT,
    CHAT_HISTORY_LIMIT,
    CHAT_QUICK_DICE,
    CHAT_SEND_LABEL,
    CHAT_TEXT_PLACEHOLDER,
  } from '../../model';

  /**
   * Отправка в ленту: строка кубов и поле сообщения.
   *
   * Кубы не бросают сами по себе, а набирают формулу в поле: нажал к20 —
   * получил «1к20», нажал ещё раз — «2к20». Так видно, что уйдёт, и формулу
   * можно поправить руками. Отдельного поля для сложных выражений нет — их
   * пишут прямо в чат.
   */
  const { disabled = false } = defineProps<{
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    'send-text': [text: string];
    'send-dice': [expression: string, label: string | undefined];
  }>();

  const { looksLikeDice } = useNexusDice();

  /** Перенос строки: по нему видно, что сообщение многострочное. */
  const NEW_LINE = String.fromCharCode(10);

  const text = ref('');

  /**
   * Свои отправленные сообщения, свежие первыми.
   *
   * За столом одно и то же повторяют часто — тот же бросок, та же реплика, —
   * и набирать это заново утомительно.
   */
  const history = ref<Array<string>>([]);

  /** Где сейчас стоим в истории; `-1` — в пустом поле, ещё не листали. */
  const historyIndex = ref(-1);

  const canSend = computed(() => !disabled && !!text.value.trim());

  /**
   * Отправляет набранное. Сообщение, целиком состоящее из формулы, уходит
   * броском: за столом бросок так и записывают — «2к6+3», «2к20вл1».
   */
  function send(): void {
    if (!canSend.value) {
      return;
    }

    const value = text.value.trim();

    if (looksLikeDice(value)) {
      emit('send-dice', value, undefined);
    } else {
      emit('send-text', value);
    }

    // Подряд отправленное одно и то же в истории не двоится: листать через
    // повторы утомительно.
    if (history.value[0] !== value) {
      history.value = [value, ...history.value].slice(0, CHAT_HISTORY_LIMIT);
    }

    historyIndex.value = -1;
    text.value = '';
  }

  /**
   * Стрелки листают историю, но только пока в поле одна строка: в многострочном
   * сообщении они двигают курсор, и подменять текст было бы враждебно.
   *
   * @param event Нажатие клавиши.
   * @param step Куда шагнуть по истории.
   */
  function handleHistoryKey(event: KeyboardEvent, step: number): void {
    if (disabled || text.value.includes(NEW_LINE)) {
      return;
    }

    event.preventDefault();
    walkHistory(step);
  }

  /**
   * Листает свои прежние сообщения.
   * @param step `1` — к более раннему, `-1` — к более свежему.
   */
  function walkHistory(step: number): void {
    const next = historyIndex.value + step;

    if (next < -1 || next >= history.value.length) {
      return;
    }

    historyIndex.value = next;
    text.value = next === -1 ? '' : (history.value[next] ?? '');
  }

  /**
   * Набирает куб в поле ввода, накапливая их количество.
   *
   * Набранный руками текст кнопка не стирает: формула дописывается в конец, и
   * решать, что с ней делать, остаётся человеку.
   *
   * @param sides Сколько граней у куба.
   */
  function addDie(sides: number): void {
    if (disabled) {
      return;
    }

    const current = text.value.trim();
    const same = new RegExp(`^(\\d{1,3})?к${sides}$`, 'i').exec(current);

    if (same) {
      text.value = `${Number(same[1] ?? 1) + 1}к${sides}`;

      return;
    }

    // Прежняя формула заменяется целиком, а набранный текст остаётся:
    // стирать написанное кнопка не вправе.
    text.value =
      !current || looksLikeDice(current)
        ? `1к${sides}`
        : `${current} 1к${sides}`;
  }
</script>

<template>
  <!-- Поле ввода берём готовое: Enter отправляет, Shift+Enter переносит, а
    высота растёт под текст — своей реализации это не требует -->
  <UChatPrompt
    v-model="text"
    :rows="1"
    :maxrows="6"
    :disabled="disabled"
    :placeholder="CHAT_TEXT_PLACEHOLDER"
    :ui="{ base: 'max-h-40' }"
    @submit.prevent="send"
    @keydown.down="handleHistoryKey($event, 1)"
    @keydown.up="handleHistoryKey($event, -1)"
  >
    <!-- Кубы над полем: бросок в игре делают чаще, чем пишут -->
    <template #header>
      <div class="flex flex-wrap items-center gap-1.5">
        <UTooltip
          v-for="sides in CHAT_QUICK_DICE"
          :key="sides"
          :text="`${CHAT_DICE_QUICK_HINT} к${sides}`"
        >
          <UButton
            size="xs"
            color="neutral"
            variant="subtle"
            :disabled="disabled"
            :label="`к${sides}`"
            @click.left.exact.prevent="addDie(sides)"
          />
        </UTooltip>
      </div>
    </template>

    <template #footer>
      <UButton
        icon="tabler:send-2"
        class="ms-auto"
        :disabled="!canSend"
        :aria-label="CHAT_SEND_LABEL"
        @click.left.exact.prevent="send"
      />
    </template>
  </UChatPrompt>
</template>
