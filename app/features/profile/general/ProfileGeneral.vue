<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { AchievementsCard, PersonalDataCard } from './ui';

  defineProps<{
    profile?: UserProfile;
  }>();
</script>

<template>
  <div class="space-y-6">
    <PersonalDataCard :profile="profile" />

    <AchievementsCard />
  </div>
</template>
