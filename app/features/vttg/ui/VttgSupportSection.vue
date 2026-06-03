<script setup lang="ts">
  import { VTTG_SUPPORT } from '../model';
  import VttgSectionHeading from './VttgSectionHeading.vue';
</script>

<template>
  <section class="vttg-support-section py-28">
    <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
      <div
        class="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[oklch(0.828_0.189_84.429)]/20 bg-elevated px-6 py-16 text-center"
      >
        <span
          class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.828_0.189_84.429)]/60 to-transparent"
        />

        <span
          class="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[oklch(0.828_0.189_84.429)]/10 blur-3xl"
        />

        <div class="relative">
          <VttgSectionHeading
            :title="VTTG_SUPPORT.title"
            :subtitle="VTTG_SUPPORT.description"
          />

          <div class="flex justify-center">
            <UButton
              v-bind="VTTG_SUPPORT.action"
              class="vttg-support-button"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .vttg-support-section {
    display: block;
  }
</style>
