<script setup lang="ts">
  import { InfoTooltip } from '~ui/tooltip';

  /**
   * Рамка блока строк механики: заголовок, кнопка добавления рядом с ним и сами
   * строки внутри рамки.
   *
   * Рамка включается заголовком. Она нужна там, где блоков подряд много — в
   * механике умения класса их шесть, — и подпись «строк нет» с кнопкой во всю
   * ширину растягивали пустое умение на несколько экранов, а границы блоков
   * приходилось угадывать по заголовкам. Без заголовка блок рисуется как
   * раньше: формы черты, вида и предыстории заголовки блоков рисуют сами.
   *
   * Слоты: строки блока — в стандартный; `add` — своя кнопка добавления, когда
   * обычной не хватает (у модификаторов вид выбирают меню); `footer` — отметки,
   * которые настраивают блок целиком, а не строку.
   */
  const {
    title = undefined,
    hint = undefined,
    summary = undefined,
    empty = undefined,
    count = 0,
    addLabel = undefined,
  } = defineProps<{
    /** Заголовок блока; пусто — прежний вид, без рамки и без шапки. */
    title?: string;

    /** Подробное пояснение к блоку: в рамке живёт под значком у заголовка. */
    hint?: string;

    /** Короткая подпись-пояснение строкой сверху; только в прежнем виде. */
    summary?: string;

    /** Подпись «строк нет»; только в прежнем виде. */
    empty?: string;

    /** Сколько строк в блоке; ноль — бейдж не показывается. */
    count?: number;

    /** Подпись кнопки добавления; пусто — кнопку рисует слот `add`. */
    addLabel?: string;
  }>();

  const emit = defineEmits<{ add: [] }>();

  /** Текст подсказки: подробности, а если их нет — сама подпись блока. */
  const hintText = computed(() => hint ?? summary);
</script>

<template>
  <section
    v-if="title"
    class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/20 p-3"
  >
    <div class="flex items-center gap-2">
      <h3 class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">
        {{ title }}
      </h3>

      <InfoTooltip
        v-if="hintText"
        :text="hintText"
        icon="tabler:info-circle-filled"
        class="shrink-0 text-dimmed"
      />

      <UBadge
        v-if="count"
        size="sm"
        color="primary"
        variant="subtle"
        class="shrink-0 tabular-nums"
      >
        {{ count }}
      </UBadge>

      <slot name="add">
        <UButton
          v-if="addLabel"
          icon="tabler:plus"
          :label="addLabel"
          color="primary"
          variant="soft"
          size="xs"
          class="shrink-0"
          @click.left.exact.prevent="emit('add')"
        />
      </slot>
    </div>

    <slot />

    <slot name="footer" />
  </section>

  <div
    v-else
    class="flex flex-col gap-3"
  >
    <InfoTooltip
      v-if="summary && hintText"
      :text="hintText"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ summary }}</span>
    </InfoTooltip>

    <p
      v-if="empty && !count"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ empty }}
    </p>

    <slot />

    <slot name="add">
      <UButton
        v-if="addLabel"
        icon="tabler:plus"
        :label="addLabel"
        color="primary"
        variant="soft"
        block
        @click.left.exact.prevent="emit('add')"
      />
    </slot>

    <slot name="footer" />
  </div>
</template>
