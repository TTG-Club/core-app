<script setup lang="ts">
  import {
    PRIVACY_POLICY_LINK_LABEL,
    PRIVACY_POLICY_ROUTE,
  } from '~infrastructure/privacy-policy/model';

  import { useCookieConsent } from '../composables';
  import {
    COOKIE_CONSENT_ACCEPT_LABEL,
    COOKIE_CONSENT_CLOSE_ICON,
    COOKIE_CONSENT_CLOSE_LABEL,
    COOKIE_CONSENT_DESCRIPTION,
    COOKIE_CONSENT_ICON,
    COOKIE_CONSENT_TITLE,
    COOKIE_POLICY_PAGE_TITLE,
    COOKIE_POLICY_ROUTE,
  } from '../model';

  const { isVisible, acceptAll, acceptNecessary } = useCookieConsent();
</script>

<template>
  <Transition name="cookie-consent">
    <UCard
      v-if="isVisible"
      role="region"
      :aria-label="COOKIE_CONSENT_TITLE"
      variant="outline"
      class="fixed inset-x-3 bottom-[calc(var(--navbar-height)+0.75rem)] z-90 max-w-2xl shadow-2xl md:inset-x-auto md:bottom-4 md:left-[calc(var(--navbar-width)+1rem)]"
      :ui="{ body: 'p-4 sm:p-4' }"
    >
      <div class="flex items-start gap-3">
        <UIcon
          :name="COOKIE_CONSENT_ICON"
          class="mt-0.5 size-5 shrink-0 text-primary"
        />

        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-highlighted">
              {{ COOKIE_CONSENT_TITLE }}
            </span>

            <p class="text-xs leading-5 text-muted">
              {{ COOKIE_CONSENT_DESCRIPTION }}
            </p>

            <div class="flex flex-wrap gap-x-3">
              <ULink
                :to="COOKIE_POLICY_ROUTE"
                class="text-xs leading-5 text-primary hover:underline"
              >
                {{ COOKIE_POLICY_PAGE_TITLE }}
              </ULink>

              <ULink
                :to="PRIVACY_POLICY_ROUTE"
                class="text-xs leading-5 text-primary hover:underline"
              >
                {{ PRIVACY_POLICY_LINK_LABEL }}
              </ULink>
            </div>
          </div>

          <div class="flex shrink-0 items-center">
            <UButton
              :label="COOKIE_CONSENT_ACCEPT_LABEL"
              color="primary"
              size="sm"
              class="justify-center px-5"
              @click.left.exact.prevent="acceptAll"
            />
          </div>
        </div>

        <UButton
          :icon="COOKIE_CONSENT_CLOSE_ICON"
          :aria-label="COOKIE_CONSENT_CLOSE_LABEL"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          class="-mt-1 -mr-1 shrink-0"
          @click.left.exact.prevent="acceptNecessary"
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
