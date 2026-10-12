<script setup lang="ts">
  import type { AdminOnlineSiteCard } from '../model';

  import AdminOnlineStatsRow from './AdminOnlineStatsRow.vue';

  defineProps<{
    card: AdminOnlineSiteCard;
    isPending: boolean;
  }>();
</script>

<template>
  <UCard variant="subtle">
    <dl class="space-y-3 text-sm">
      <div class="flex items-center justify-between gap-4">
        <dt class="text-muted">{{ card.siteLabel }}</dt>

        <dd class="font-semibold text-highlighted">
          {{ card.siteId }}
        </dd>
      </div>

      <AdminOnlineStatsRow
        v-for="row in card.rows"
        :key="row.label"
        :is-pending="isPending"
        :row="row"
      />
    </dl>
  </UCard>
</template>
