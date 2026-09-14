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
  const fieldRef = useTemplateRef<HTMLButtonElement>('fieldRef');

  // Список выбирается один раз по устройству запроса, поэтому сервер и клиент
  // рисуют одинаковую строку — гидратация не спорит сама с собой.
  const { typed, isIdle } = useSearchHintTypewriter(
    isMobile ? SEARCH_PANEL_HINT_WORDS_COMPACT : SEARCH_PANEL_HINT_WORDS,
    fieldRef,
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
      ref="fieldRef"
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
      <!--
        Свет по контуру: кольцо-маска в толщину рамки, а под ним вращается
        квадрат с дугами. Поворот и мерцание браузер ведёт одной композицией,
        не перерисовывая градиент на каждом кадре.
      -->
      <span
        aria-hidden="true"
        :class="$style.glow"
      >
        <span :class="$style.arcs" />
      </span>

      <UIcon
        name="tabler:search"
        class="size-5 shrink-0 text-dimmed transition-colors group-hover:text-primary"
      />

      <!--
        Подсказка живая: «Поиск по» стоит на месте, а раздел за ним машинка
        стирает по букве и печатает следующий. Скринридерам эта чехарда
        бесполезна — им кнопка представляется целой фразой через `aria-label`.
      -->
      <!-- Высота строки задана явно (`h-5 sm:h-6` — ровно интервал текста):
        подсказка изолирована от раскладки поля, и без неё схлопнулась бы -->
      <span
        aria-hidden="true"
        :class="[
          $style.hint,
          'h-5 min-w-0 flex-1 text-sm text-muted sm:h-6 sm:text-base',
        ]"
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
     края свет не выходит.

     Дуги бегут и на телефонах: это поворот и прозрачность готового слоя, их
     браузер ведёт в композиторе без перерисовки. Стоят они только при
     системной настройке «меньше движения», а когда шапка главной уходит с
     экрана, замирают: `--home-hero-play-state` ставит HomeHero. */

  $arc-track: conic-gradient(
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

  /* При системной настройке «меньше движения» дуги стоят на месте и светят
     ровно, вполсилы */
  .glow {
    pointer-events: none;

    position: absolute;
    /* Ровно по рамке: абсолютный слой считает края от внутренней (padding)
       коробки, поэтому -1px возвращает его на край поля, а padding в 1px
       задаёт толщину светящейся нити — ровно как у самой рамки. */
    inset: -1px;

    padding: 1px;
    border-radius: inherit;

    opacity: 0.6;

    /* Маска оставляет от дорожки только кольцо в эту толщину — без неё
       градиент залил бы всё поле. */
    mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
    mask-clip: content-box, border-box;
    mask-composite: exclude;

    transition: filter 250ms ease;

    @media (prefers-reduced-motion: no-preference) {
      animation: arc-flicker 7.3s ease-in-out infinite
        var(--home-hero-play-state, running);
    }
  }

  .field:hover .glow,
  .field:focus-visible .glow {
    filter: brightness(1.35) saturate(1.1);
  }

  /* Поворот дорожки вокруг центра поля — то же, что сдвиг начального угла
     конического градиента. Квадрат шире поля на 64px, поэтому его сторона
     всегда не меньше диагонали поля и при любом повороте он закрывает рамку
     целиком. */
  .arcs {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    aspect-ratio: 1;
    width: calc(100% + 64px);

    background: $arc-track;

    @media (prefers-reduced-motion: no-preference) {
      animation: arc-travel 9s linear infinite
        var(--home-hero-play-state, running);
    }
  }

  @keyframes arc-travel {
    to {
      rotate: 360deg;
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
    /* Машинка меняет текст по букве раз в десятки миллисекунд. Изоляция
       (`strict`: размер, раскладка, отрисовка) замыкает каждую смену внутри
       строки: браузер не пересчитывает поле и шапку вокруг и перерисовывает
       только её прямоугольник. Размер строке задают флекс и высота из
       разметки, не текст */
    contain: strict;
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
    .wordIdle::after {
      animation: none;
    }
  }
</style>
