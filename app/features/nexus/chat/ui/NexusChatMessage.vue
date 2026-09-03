<script setup lang="ts">
  import type { ChatFeedEvent } from '../../model';

  import { SpellDrawer } from '~spells/drawer';
  import { MarkupRender } from '~ui/markup';

  import {
    CHAT_DICE_TOTAL_LABEL,
    CHAT_FAILED_LABEL,
    CHAT_RETRY_LABEL,
    CHAT_SENDING_LABEL,
    CHAT_SPELL_CANTRIP_LABEL,
    CHAT_SPELL_OPEN_LABEL,
    CHAT_SPELL_TARGET_LABEL,
  } from '../../model';

  /**
   * Событие ленты пузырём.
   *
   * Пузырь занимает всю ширину и не прижимается к краю: в групповом разговоре
   * важнее, кто сказал, чем своё это или чужое, а имя с аватаром в шапке
   * читаются одинаково у всех сообщений. Своё отличается цветом рамки.
   */
  const { event, authorName, isOwn } = defineProps<{
    event: ChatFeedEvent;
    authorName: string;
    isOwn: boolean;
  }>();

  const emit = defineEmits<{
    retry: [event: ChatFeedEvent];
  }>();

  const { format } = useDayjs();
  const overlay = useOverlay();

  /** Цвет крита у выпавшего куба — тот же, что и в истории бросков. */
  const CRITICAL_COLORS = {
    success: 'success',
    failure: 'error',
  } as const;

  const timeLabel = computed(() => format(event.createdAt, 'HH:mm'));

  const initial = computed(() => authorName.charAt(0).toUpperCase());

  const spellLevelLabel = computed(() => {
    const level = event.spellCast?.level;

    if (level === null || level === undefined) {
      return null;
    }

    return level === 0 ? CHAT_SPELL_CANTRIP_LABEL : `${level} круг`;
  });

  /**
   * Выражение неподтверждённого броска. Результат считает сервер, поэтому до
   * ответа показать нечего, кроме черновика отправки.
   */
  const pendingDiceExpression = computed(
    () => event.draft?.diceRoll?.expression ?? null,
  );

  const bubbleClass = computed(() => [
    'flex flex-col gap-1.5 rounded-xl border p-2 text-sm shadow-sm',
    isOwn
      ? 'border-primary/30 bg-elevated/40'
      : 'border-default/60 bg-elevated/30',
    event.failed ? 'ring-1 ring-error' : '',
  ]);

  /**
   * Открывает существующий дровер справочника заклинаний: свой в чате не
   * заводится.
   */
  function openSpell(): void {
    const spellId = event.spellCast?.spellId;

    if (!spellId) {
      return;
    }

    const drawer = overlay.create(SpellDrawer, {
      props: {
        url: spellId,
        onClose: () => drawer.close(),
      },
      destroyOnClose: true,
    });

    drawer.open();
  }
</script>

<template>
  <!--
    Событие самой игры — старт или завершение сессии. Это не чьё-то
    сообщение, поэтому и выглядит иначе: строкой по центру, без пузыря.
  -->
  <div
    v-if="event.type === 'SYSTEM'"
    class="flex items-center justify-center gap-2 py-1 text-xs text-muted"
  >
    <UIcon
      name="tabler:info-circle"
      class="size-4 shrink-0"
    />

    <span>{{ event.text }}</span>

    <time :datetime="event.createdAt">{{ timeLabel }}</time>
  </div>

  <div
    v-else
    :class="bubbleClass"
  >
    <div class="flex items-center gap-2">
      <UAvatar
        :alt="initial"
        size="2xs"
        class="shrink-0 bg-accented"
      />

      <span
        class="text-xs font-medium"
        :class="isOwn ? 'text-primary' : 'text-toned'"
      >
        {{ authorName }}
      </span>

      <time
        class="text-[10px] text-dimmed"
        :datetime="event.createdAt"
      >
        {{ timeLabel }}
      </time>

      <UIcon
        v-if="event.pending"
        name="tabler:clock"
        class="size-3 text-dimmed"
        :aria-label="CHAT_SENDING_LABEL"
      />
    </div>

    <!-- Сообщение рисуется разметкой сайта: в чат попадает и текст с листа
      персонажа — со ссылками на глоссарий, списками и таблицами. Обычный текст
      проходит через неё как есть, переносы строк сохраняет `whitespace-pre-wrap` -->
    <div
      v-if="event.type === 'TEXT' && event.text"
      class="leading-snug wrap-break-word whitespace-pre-wrap text-highlighted"
    >
      <MarkupRender :render-node="event.text" />
    </div>

    <!-- Бросок: сервер прислал результат, и его видно целиком -->
    <div
      v-else-if="event.type === 'DICE_ROLL' && event.diceRoll"
      class="flex flex-col gap-1"
    >
      <!-- Чем бросали — первой строкой: по одной формуле не понять, атака
        это, урон или проверка навыка -->
      <span
        v-if="event.diceRoll.subject"
        class="font-medium text-highlighted"
      >
        {{ event.diceRoll.subject }}
      </span>

      <!-- Выпавшие кубы поштучно, как в истории бросков: по ним читается,
        как получился итог. Отброшенные роллером остаются видны зачёркнутыми -->
      <div
        v-for="(group, groupIndex) in event.diceRoll.groups"
        :key="groupIndex"
        class="flex flex-wrap items-center gap-1.5"
      >
        <span
          v-if="group.label"
          class="text-xs text-muted"
        >
          {{ group.label }}
        </span>

        <UBadge
          v-for="(roll, rollIndex) in group.rolls"
          :key="rollIndex"
          size="sm"
          class="min-w-6 justify-center"
          :color="roll.critical ? CRITICAL_COLORS[roll.critical] : 'neutral'"
          :variant="roll.valid ? 'subtle' : 'outline'"
          :class="roll.valid ? '' : 'line-through opacity-60'"
          :label="`${roll.value}`"
        />
      </div>

      <!-- Прежние события считал сервис: у них вместо групп список кубов -->
      <span
        v-if="!event.diceRoll.groups.length && event.diceRoll.results.length"
        class="flex flex-wrap items-center gap-1.5"
      >
        <UBadge
          v-for="(result, index) in event.diceRoll.results"
          :key="index"
          color="neutral"
          variant="subtle"
          size="sm"
          class="min-w-6 justify-center"
          :label="`${result}`"
        />
      </span>

      <span class="flex flex-wrap items-center gap-1.5">
        <!-- Вид броска вместо общего «Итого»: «Атака», «Урон», «Результат» -->
        <span class="text-sm text-muted">
          {{ event.diceRoll.label || CHAT_DICE_TOTAL_LABEL }}:
        </span>

        <span class="text-base font-semibold text-highlighted">
          {{ event.diceRoll.total }}
        </span>
      </span>
    </div>

    <!-- Бросок в полёте: результата ещё нет, и показать пока нечего, кроме
      самой формулы -->
    <span
      v-else-if="event.type === 'DICE_ROLL' && pendingDiceExpression"
      class="font-mono text-xs text-muted"
    >
      {{ pendingDiceExpression }}
    </span>

    <div
      v-else-if="event.type === 'SPELL_CAST' && event.spellCast"
      class="flex flex-col gap-1"
    >
      <span class="flex flex-wrap items-center gap-2">
        <UIcon
          name="tabler:sparkles"
          class="size-4 text-primary"
        />

        <span class="font-medium text-highlighted">
          {{ event.spellCast.name }}
        </span>

        <UBadge
          v-if="spellLevelLabel"
          color="neutral"
          variant="subtle"
          size="sm"
          :label="spellLevelLabel"
        />
      </span>

      <span
        v-if="event.spellCast.target"
        class="text-sm text-muted"
      >
        {{ CHAT_SPELL_TARGET_LABEL }}: {{ event.spellCast.target }}
      </span>

      <UButton
        v-if="event.spellCast.spellId"
        size="xs"
        color="primary"
        variant="link"
        class="self-start p-0"
        :label="CHAT_SPELL_OPEN_LABEL"
        @click.left.exact.prevent="openSpell"
      />
    </div>

    <!-- Отправка не дошла: событие остаётся в ленте с кнопкой повтора -->
    <div
      v-if="event.failed"
      class="flex flex-wrap items-center gap-2"
    >
      <span class="text-xs text-error">{{ CHAT_FAILED_LABEL }}</span>

      <UButton
        size="xs"
        color="error"
        variant="subtle"
        icon="tabler:refresh"
        :label="CHAT_RETRY_LABEL"
        @click.left.exact.prevent="emit('retry', event)"
      />
    </div>
  </div>
</template>
