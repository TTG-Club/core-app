<script setup lang="ts">
  import { FAQ_ITEMS } from '../model';
</script>

<template>
  <section class="border-y border-default bg-elevated">
    <div class="mx-auto px-6 py-20 lg:max-w-330 lg:px-8">
      <div class="mb-12 text-center">
        <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
          Частые вопросы
        </h2>

        <p class="mt-3 text-toned">Всё, что нужно знать перед первой игрой</p>
      </div>

      <UAccordion
        :items="FAQ_ITEMS"
        size="xl"
        class="w-full [&_button]:py-5 [&_button_span]:text-xl [&_button_span]:font-medium [&_p]:text-lg"
      />
    </div>
  </section>
</template>
