<!--
  Фон страницы: тёплый свет сверху, как в шапке главной, и волосяная клетка
  по краям. Только CSS — без анимации, чтобы не спорить с содержимым;
  частицы, если нужны, страница кладёт отдельно (HomeBackground).

  Ставится первым ребёнком в слот layout'а. Слой ложится под всю страницу —
  ближайший позиционированный предок у него контейнер страницы в `app.vue`,
  поэтому обёртки страницы между ними не должны быть `relative`, иначе фон
  обрежется их шириной.
-->
<script setup lang="ts">
  const { glow = true } = defineProps<{
    /**
     * Тёплый свет сверху. Нужен страницам с заголовком-шапкой (каталог игр);
     * в профиле над аватаром он лишний — там его выключают.
     */
    glow?: boolean;
  }>();
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 -z-1 overflow-hidden"
  >
    <!-- Тёплый свет сверху — «очаг» над заголовком и первым рядом содержимого -->
    <div
      v-if="glow"
      :class="$style.glow"
    />

    <!-- Клетка растворяется к подвалу: внизу страницы остаётся чистый фон -->
    <div :class="$style.fade">
      <div :class="$style.grid" />
    </div>
  </div>
</template>

<style lang="scss" module>
  /* Шаг клетки мелкий: так она читается полем боевой карты, а не
     разлиновкой */
  $cell: 48px;

  /* Сколько клетка растворяется, подходя к краю колонки контента */
  $gridFade: 160px;

  /* Края колонки контента: layout'ы страниц с фоном центрируют её по
     `--max-content` внутри того же контейнера, что и фон */
  $columnStart: calc(50% - var(--max-content) / 2);
  $columnEnd: calc(50% + var(--max-content) / 2);

  .glow {
    position: absolute;
    inset: 0 0 auto;
    height: 960px;
    background:
      radial-gradient(
        50% 70% at 50% 0%,
        color-mix(in oklch, var(--ui-primary) 16%, transparent) 0%,
        transparent 70%
      ),
      radial-gradient(
        30% 40% at 100% 0%,
        color-mix(in oklch, var(--ui-primary) 6%, transparent) 0%,
        transparent 70%
      );
  }

  .fade {
    position: absolute;
    inset: 0;
    mask-image: linear-gradient(to bottom, #000 0%, #000 35%, transparent 90%);
  }

  .grid {
    position: absolute;
    inset: 0;
    /* Вдвое тусклее цвета клетки из темы: клетка — фактура фона, а не
       разлиновка, которая спорит с рамками блоков */
    opacity: 0.5;
    /* Два повтора с одним шагом дают квадратную клетку, а не полоски */
    background-image:
      repeating-linear-gradient(
        to right,
        var(--color-backdrop-grid) 0 1px,
        transparent 1px $cell
      ),
      repeating-linear-gradient(
        to bottom,
        var(--color-backdrop-grid) 0 1px,
        transparent 1px $cell
      );

    /* Клетка заполняет только пустые поля по бокам от колонки и гаснет у её
       края: под текстом она мешала бы читать. Уже колонки полей нет — и
       клетки тоже, остаются свет и сами блоки */
    mask-image: linear-gradient(
      to right,
      #000 calc(#{$columnStart} - #{$gridFade}),
      transparent $columnStart,
      transparent $columnEnd,
      #000 calc(#{$columnEnd} + #{$gridFade})
    );
  }
</style>
