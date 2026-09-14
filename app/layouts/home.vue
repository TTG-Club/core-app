<script setup lang="ts">
  import { AppFooter } from '~infrastructure/footer';
</script>

<template>
  <!--
    Макет главной отличается от `default` двумя вещами:

    1) Он НЕ обрезает контент по ширине и не даёт горизонтальных полей — этим
       занимается сама страница. Так шапка-герой растягивается во всю ширину
       (как на референсе), а сетка блоков ниже остаётся в колонке.
    2) На 2K и шире колонка контента расширяется до `--max-content-wide`:
       на 1320px главная выглядела потерянной посреди пустого экрана.
  -->
  <div class="flex min-h-dvh w-full flex-col">
    <div class="flex-auto pb-8">
      <slot name="default" />
    </div>

    <AppFooter />
  </div>
</template>
