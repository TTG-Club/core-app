<script setup lang="ts">
  import { VTTG_COMPENDIUM_CHANNELS } from '#shared/consts';
  import {
    VTTG_COMPENDIUM_PAGE_HINT,
    VTTG_COMPENDIUM_PAGE_TITLE,
    VTTG_COMPENDIUM_SEO_TITLE,
  } from '~admin/vttg-compendium/model';
  import { VttgCompendiumChannelCard } from '~admin/vttg-compendium/ui';

  useSeoMeta({
    title: VTTG_COMPENDIUM_SEO_TITLE,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="VTTG_COMPENDIUM_PAGE_TITLE"
  >
    <div class="space-y-6">
      <p class="text-sm text-muted">
        {{ VTTG_COMPENDIUM_PAGE_HINT }}
      </p>

      <div class="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <VttgCompendiumChannelCard
          v-for="channel in VTTG_COMPENDIUM_CHANNELS"
          :key="channel"
          :channel
        />
      </div>
    </div>
  </NuxtLayout>
</template>
