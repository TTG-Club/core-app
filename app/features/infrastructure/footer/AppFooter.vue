<script setup lang="ts">
  import {
    FOOTER_COPYRIGHT,
    FOOTER_DISCLAIMER,
    FOOTER_SOCIAL_LINKS,
    FOOTER_SUPPORT_EMAIL,
    FOOTER_SUPPORT_EMAIL_HREF,
    FOOTER_SUPPORT_LINKS,
  } from './model';
</script>

<template>
  <UFooter
    :ui="{
      root: 'mt-auto border-t border-default',
      container: 'py-4 lg:flex lg:items-center lg:justify-between lg:gap-x-3',
      left: 'flex items-center justify-center lg:justify-start lg:flex-1 gap-x-1.5 lg:order-1',
      center: 'mt-3 lg:mt-0 lg:order-2 flex items-center justify-center',
      right:
        'mt-3 lg:mt-0 lg:flex-1 flex items-center justify-center lg:justify-end gap-x-1.5 lg:order-3',
    }"
  >
    <template #left>
      <div class="flex flex-col gap-1 text-center lg:text-left">
        <span class="text-sm text-muted">
          {{ FOOTER_COPYRIGHT }}
        </span>

        <span class="text-xs text-dimmed lg:whitespace-nowrap">
          {{ FOOTER_DISCLAIMER }}
        </span>
      </div>
    </template>

    <template #right>
      <div class="flex flex-col items-center gap-2 lg:items-end">
        <div class="flex flex-wrap items-center gap-1">
          <UButton
            v-for="link in FOOTER_SOCIAL_LINKS"
            :key="link.url"
            :href="link.url"
            :icon="link.icon"
            :aria-label="link.label"
            target="_blank"
            variant="ghost"
            color="neutral"
            size="sm"
            square
          />

          <USeparator
            orientation="vertical"
            class="mx-1 h-5"
          />

          <UButton
            v-for="link in FOOTER_SUPPORT_LINKS"
            :key="link.url"
            :href="link.url"
            :icon="link.icon"
            :aria-label="link.label"
            target="_blank"
            variant="ghost"
            color="neutral"
            size="sm"
            square
          />
        </div>

        <UButton
          :label="FOOTER_SUPPORT_EMAIL"
          :href="FOOTER_SUPPORT_EMAIL_HREF"
          icon="tabler:mail"
          variant="link"
          color="neutral"
          size="xs"
        />
      </div>
    </template>
  </UFooter>
</template>
