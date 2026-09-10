<script setup lang="ts">
  import { HomeGreetings } from '~home/greetings';

  import { useGlobalSearch } from '../composable';
  import { useSearchHintTypewriter } from './composable';
  import {
    SEARCH_PANEL_HINT_PREFIX,
    SEARCH_PANEL_HINT_WORDS,
    SEARCH_PANEL_HINT_WORDS_COMPACT,
    SEARCH_PANEL_PLACEHOLDER,
    SEARCH_PANEL_SHORTCUT,
  } from './model';

  const { open } = useGlobalSearch();
  const { isDesktop, isMobile } = useDevice();

  const styles = useCssModule();

  // Список выбирается один раз по устройству запроса, поэтому сервер и клиент
  // рисуют одинаковую строку — гидратация не спорит сама с собой.
  const { typed, isIdle } = useSearchHintTypewriter(
    isMobile ? SEARCH_PANEL_HINT_WORDS_COMPACT : SEARCH_PANEL_HINT_WORDS,
  );

  /** Курсор мигает только в паузах — на наборе и стирании он горит ровно. */
  const wordClass = computed<Array<string>>(() =>
    isIdle.value ? [styles.word, styles.wordIdle] : [styles.word],
  );
</script>

<template>
  <div
    class="relative z-10 flex w-full max-w-3xl flex-col items-center 2xl:max-w-4xl"
  >
    <HomeGreetings class="-z-1" />

    <!--
      Поле поиска, а не кнопка: так строка читается как то, во что можно
      печатать. Клик и горячая клавиша всё так же открывают палитру поиска —
      набор идёт уже в ней.
    -->
    <button
      type="button"
      :aria-label="SEARCH_PANEL_PLACEHOLDER"
      :class="[
        $style.field,
        'group relative flex w-full cursor-pointer items-center gap-3',
        'rounded-xl border border-accented bg-default px-4 py-3.5',
        'text-left transition-colors duration-200',
        'hover:border-primary/60 hover:bg-elevated',
      ]"
      @click.left.exact.prevent="open"
    >
      <UIcon
        name="tabler:search"
        class="size-5 shrink-0 text-dimmed transition-colors group-hover:text-primary"
      />

      <!--
        Подсказка живая: «Поиск по» стоит на месте, а раздел за ним машинка
        стирает по букве и печатает следующий. Скринридерам эта чехарда
        бесполезна — им кнопка представляется целой фразой через `aria-label`.
      -->
      <span
        aria-hidden="true"
        :class="[$style.hint, 'min-w-0 flex-1 text-sm text-muted sm:text-base']"
      >
        <span :class="$style.prefix">{{ SEARCH_PANEL_HINT_PREFIX }}</span>

        <span
          :class="wordClass"
          class="text-toned"
          >{{ typed }}</span
        >
      </span>

      <UKbd
        v-if="isDesktop"
        :value="SEARCH_PANEL_SHORTCUT"
        class="shrink-0"
      />
    </button>
  </div>
</template>

<style module lang="scss">
  /* --- Свет по контуру поля ----------------------------------------------
     Светится сама рамка и только она: по контуру бегут дуги основного цвета с
     неравными разрывами, а мерцание идёт по своему графику. Периоды вращения и
     мерцания не кратны друг другу, поэтому вспышки и провалы не выстраиваются
     в заметный цикл и читаются как случайные.

     Никакого размытого ореола наружу: слой лежит ровно в толщине рамки, за её
     края свет не выходит. */

  $arc-track: conic-gradient(
    from var(--arc-angle),
    transparent 0deg,
    var(--ui-color-primary-500) 14deg,
    var(--ui-color-primary-300) 34deg,
    var(--ui-color-primary-500) 54deg,
    transparent 70deg,
    transparent 106deg,
    var(--ui-color-primary-400) 128deg,
    var(--ui-color-primary-300) 142deg,
    transparent 178deg,
    transparent 214deg,
    var(--ui-color-primary-500) 236deg,
    var(--ui-color-primary-400) 262deg,
    transparent 296deg,
    transparent 324deg,
    var(--ui-color-primary-400) 342deg,
    transparent 360deg
  );

  .field {
    &::before {
      pointer-events: none;
      content: '';

      position: absolute;
      /* Ровно по рамке: абсолютный слой считает края от внутренней (padding)
         коробки, поэтому -1px возвращает его на край поля, а padding в 1px
         задаёт толщину светящейся нити — ровно как у самой рамки. */
      inset: -1px;

      padding: 1px;
      border-radius: inherit;

      background: $arc-track;

      /* Маска оставляет от дорожки только кольцо в эту толщину — без неё
         градиент залил бы всё поле. */
      mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
      mask-clip: content-box, border-box;
      mask-composite: exclude;

      transition: filter 250ms ease;
      animation:
        arc-travel 9s linear infinite,
        arc-flicker 7.3s ease-in-out infinite;
    }

    &:hover::before,
    &:focus-visible::before {
      filter: brightness(1.35) saturate(1.1);
    }
  }

  @property --arc-angle {
    inherits: false;
    initial-value: 0deg;
    syntax: '<angle>';
  }

  @keyframes arc-travel {
    0% {
      --arc-angle: 0deg;
    }

    100% {
      --arc-angle: 360deg;
    }
  }

  /* Неровные ключи — источник «случайности»: свет то вспыхивает, то почти
     гаснет, оставляя от рамки её обычную линию. */
  @keyframes arc-flicker {
    0% {
      opacity: 0.25;
    }

    9% {
      opacity: 0.9;
    }

    16% {
      opacity: 0.35;
    }

    27% {
      opacity: 1;
    }

    35% {
      opacity: 0.15;
    }

    44% {
      opacity: 0.75;
    }

    58% {
      opacity: 0.2;
    }

    67% {
      opacity: 0.95;
    }

    79% {
      opacity: 0.3;
    }

    88% {
      opacity: 0.7;
    }

    100% {
      opacity: 0.25;
    }
  }

  /* --- Строка-машинка ----------------------------------------------------- */

  .hint {
    white-space: nowrap;

    /* Подсказка длиннее поля не рубится «в лоб»: правый край растворяется.
       Полоска растворения узкая (12px) — у самого длинного раздела на телефоне
       остаётся запас шире неё, поэтому обычную строку она не трогает. Маска
       повторяется по вертикали, иначе она срезала бы курсор. */
    mask-image: linear-gradient(
      to right,
      #000 calc(100% - 0.75rem),
      transparent
    );
    mask-repeat: repeat-y;
  }

  .prefix {
    margin-inline-end: 0.35em;
  }

  .word {
    /* Пробел внутри раздела и хвост при наборе не схлопываются */
    white-space: pre;

    /* Курсор набора — часть слова, поэтому едет вместе с ним по букве */
    &::after {
      content: '';

      display: inline-block;

      width: 2px;
      height: 1.05em;
      margin-inline-start: 0.16em;
      border-radius: 999px;

      vertical-align: -0.15em;

      background: var(--ui-primary);
    }
  }

  /* В паузах курсор мигает, на наборе и стирании горит ровно — как в терминале */
  .wordIdle::after {
    animation: hint-caret-blink 1.2s ease-in-out infinite;
  }

  @keyframes hint-caret-blink {
    0%,
    46% {
      opacity: 1;
    }

    54%,
    100% {
      opacity: 0.15;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .field::before {
      opacity: 0.6;
      animation: none;
    }

    .wordIdle::after {
      animation: none;
    }
  }
</style>
