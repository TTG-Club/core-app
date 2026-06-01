<script setup lang="ts">
  import { FAQ_ITEMS, VTTG_FAQ_HEADING } from '../model';
  import VttgSectionHeading from './VttgSectionHeading.vue';
</script>

<template>
  <section class="border-y border-default bg-elevated">
    <div class="mx-auto px-6 py-20 lg:max-w-330 lg:px-8">
      <VttgSectionHeading
        :title="VTTG_FAQ_HEADING.title"
        :subtitle="VTTG_FAQ_HEADING.subtitle"
      />

      <UAccordion
        :items="FAQ_ITEMS"
        class="mx-auto max-w-3xl"
        :ui="{
          item: 'mb-3 rounded-xl border border-default/80 bg-default/30 px-5 transition-all duration-200 hover:bg-default/50 hover:border-[oklch(0.828_0.189_84.429)]/30 last:border-b data-[state=open]:border-[oklch(0.828_0.189_84.429)]/50 data-[state=open]:bg-default/50',
          trigger:
            'py-5 text-lg font-medium text-highlighted cursor-pointer focus-visible:outline-none',
          content: 'overflow-hidden',
          body: 'pb-5 text-base leading-relaxed text-toned',
          trailingIcon: 'text-[oklch(0.828_0.189_84.429)]',
        }"
      />
    </div>
  </section>
</template>
