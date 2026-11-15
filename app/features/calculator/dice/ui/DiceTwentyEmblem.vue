<script setup lang="ts">
  import {
    D20_EMBLEM_EDGES_PATH,
    D20_EMBLEM_FACE_PATH,
    D20_EMBLEM_OUTLINE_PATH,
    D20_EMBLEM_VIEW_BOX,
  } from '../model';
</script>

<template>
  <!-- Двадцатигранник анфас. Цвет берётся из `currentColor`, размер задаёт
    родитель классом: эмблема служит и костью с результатом, и заглушкой
    пустого подноса -->
  <svg
    :viewBox="D20_EMBLEM_VIEW_BOX"
    :class="$style.emblem"
    aria-hidden="true"
  >
    <path
      :d="D20_EMBLEM_OUTLINE_PATH"
      :class="$style.outline"
    />

    <path
      :d="D20_EMBLEM_EDGES_PATH"
      :class="$style.edges"
    />

    <path
      :d="D20_EMBLEM_FACE_PATH"
      :class="$style.face"
    />
  </svg>
</template>

<style module lang="scss">
  .emblem {
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Контур — самая плотная линия, рёбра бледнее: под числом результата
     они не должны с ним спорить */
  .outline {
    fill: currentcolor;
    fill-opacity: 0.08;
    stroke-width: 5;
  }

  .edges {
    stroke-opacity: 0.45;
    stroke-width: 2.5;
  }

  .face {
    fill: currentcolor;
    fill-opacity: 0.1;
    stroke-opacity: 0.75;
    stroke-width: 3;
  }
</style>
