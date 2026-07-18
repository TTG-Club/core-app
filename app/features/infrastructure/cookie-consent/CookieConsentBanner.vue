<script setup lang="ts">
  import { useCookieConsent } from './composables';
  import {
    COOKIE_CONSENT_ACCEPT_LABEL,
    COOKIE_CONSENT_CLOSE_LABEL,
    COOKIE_CONSENT_DESCRIPTION,
    COOKIE_CONSENT_TITLE,
  } from './model';

  const { isVisible, accept, dismiss } = useCookieConsent();
</script>

<template>
  <Transition name="cookie-consent">
    <UCard
      v-if="isVisible"
      role="region"
      :aria-label="COOKIE_CONSENT_TITLE"
      variant="outline"
      class="fixed inset-x-3 bottom-[calc(var(--navbar-height)+0.75rem)] z-90 max-w-md shadow-2xl md:inset-x-auto md:bottom-4 md:left-[calc(var(--navbar-width)+1rem)]"
      :ui="{ body: 'p-4 sm:p-4' }"
    >
      <div class="flex items-start gap-3">
        <UIcon
          name="tabler:cookie"
          class="mt-0.5 size-5 shrink-0 text-primary"
        />

        <div class="flex min-w-0 flex-col gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-highlighted">
              {{ COOKIE_CONSENT_TITLE }}
            </span>

            <p class="text-xs leading-5 text-muted">
              {{ COOKIE_CONSENT_DESCRIPTION }}
            </p>
          </div>

          <UButton
            :label="COOKIE_CONSENT_ACCEPT_LABEL"
            color="primary"
            size="sm"
            block
            @click.left.exact.prevent="accept"
          />
        </div>

        <UButton
          icon="tabler:x"
          :aria-label="COOKIE_CONSENT_CLOSE_LABEL"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          class="-mt-1 -mr-1 shrink-0"
          @click.left.exact.prevent="dismiss"
        />
      </div>
    </UCard>
  </Transition>
</template>

<style lang="scss">
  .cookie-consent-enter-active,
  .cookie-consent-leave-active {
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
  }

  .cookie-consent-enter-from,
  .cookie-consent-leave-to {
    transform: translateY(0.75rem);
    opacity: 0;
  }
</style>
