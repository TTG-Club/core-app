<script setup lang="ts">
  import type { ConnectedSocial } from './model';

  import { SocialConnections } from './model';
  import { ConnectionsInfoCard, ConnectionsListCard } from './ui';

  /**
   * Подключенные социальные сети (временные данные)
   */
  const connections = ref<ConnectedSocial[]>(
    SocialConnections.map((social) => ({
      id: social.id,
      name: social.name,
      icon: social.icon,
      color: social.color,
      isConnected: false,
      username: undefined,
    })),
  );
</script>

<template>
  <div class="space-y-6">
    <ConnectionsListCard :connections="connections" />

    <ConnectionsInfoCard />
  </div>
</template>
