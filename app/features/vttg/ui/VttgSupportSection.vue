<script setup lang="ts">
  import { VTTG_SUPPORT } from '../model';
  import VttgSectionHeading from './VttgSectionHeading.vue';
</script>

<template>
  <section class="py-28">
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
              @click.left.exact.prevent
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .vttg-support-button {
    --vttg-gold: oklch(0.828 0.189 84.429);

    border: 1px solid color-mix(in oklch, var(--vttg-gold) 35%, transparent) !important;
    border-radius: 0.75rem;

    font-weight: 600;
    color: var(--vttg-gold) !important;
    letter-spacing: 0.05em;

    background: color-mix(
      in oklch,
      var(--vttg-gold) 10%,
      transparent
    ) !important;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px
      color-mix(in oklch, var(--vttg-gold) 10%, transparent) !important;

    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .vttg-support-button:hover {
    transform: translateY(-2px);

    border-color: var(--vttg-gold) !important;

    color: var(--ui-text-highlighted) !important;

    background: color-mix(
      in oklch,
      var(--vttg-gold) 20%,
      transparent
    ) !important;
    box-shadow: 0 0 20px color-mix(in oklch, var(--vttg-gold) 25%, transparent) !important;
  }

  .vttg-support-button:active {
    transform: translateY(0);
  }
</style>
