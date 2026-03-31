<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  defineProps<{
    profile?: UserProfile;
  }>();
</script>

<template>
  <div>
    <h2 class="mb-2 text-3xl font-bold tracking-tight text-primary">
      {{ profile?.username || 'Путешественник' }}
    </h2>

    <div class="mb-6">
      <UBadge
        color="primary"
        variant="subtle"
        size="md"
      >
        Авантюрист
      </UBadge>
    </div>
  </div>
</template>
