<script setup lang="ts">
  import {
    PRIVACY_POLICY_LINK_LABEL,
    PRIVACY_POLICY_ROUTE,
  } from '~infrastructure/privacy-policy/model';

  import { useCookieNotice } from '../composables';
  import {
    COOKIE_NOTICE_CLOSE_LABEL,
    COOKIE_NOTICE_DESCRIPTION,
    COOKIE_NOTICE_DISMISS_LABEL,
    COOKIE_NOTICE_ICON,
    COOKIE_NOTICE_RELUCTANT_LABEL,
    COOKIE_NOTICE_TITLE,
    COOKIE_POLICY_PAGE_TITLE,
    COOKIE_POLICY_ROUTE,
  } from '../model';

  const { isVisible, dismiss } = useCookieNotice();
</script>

<template>
  <Transition name="cookie-consent">
    <UCard
      v-if="isVisible"
      role="region"
      :aria-label="COOKIE_NOTICE_TITLE"
      variant="outline"
      class="fixed inset-x-3 bottom-[calc(var(--navbar-height)+0.75rem)] z-90 max-w-2xl shadow-2xl md:inset-x-auto md:bottom-4 md:left-[calc(var(--navbar-width)+1rem)]"
      :ui="{ body: 'p-4 sm:p-4' }"
    >
      <div class="flex items-start gap-3">
        <UIcon
          :name="COOKIE_NOTICE_ICON"
          class="mt-0.5 size-5 shrink-0 text-primary"
        />

        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-highlighted">
              {{ COOKIE_NOTICE_TITLE }}
            </span>

            <p class="text-xs leading-5 text-muted">
              {{ COOKIE_NOTICE_DESCRIPTION }}
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

          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <UButton
              :label="COOKIE_NOTICE_DISMISS_LABEL"
              color="primary"
              size="sm"
              class="justify-center px-5"
              @click.left.exact.prevent="dismiss"
            />

            <UButton
              :label="COOKIE_NOTICE_RELUCTANT_LABEL"
              color="neutral"
              variant="ghost"
              size="sm"
              class="justify-center"
              @click.left.exact.prevent="dismiss"
            />
          </div>
        </div>

        <UButton
          icon="tabler:x"
          color="neutral"
          variant="ghost"
          size="xs"
          class="-mt-1 -mr-1 shrink-0"
          :aria-label="COOKIE_NOTICE_CLOSE_LABEL"
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
