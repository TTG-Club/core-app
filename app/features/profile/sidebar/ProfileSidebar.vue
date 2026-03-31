<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { ProfileAvatar, ProfileBadge, ProfileMiniStats } from './ui';

  defineProps<{
    profile?: UserProfile;
  }>();
</script>

<template>
  <div class="relative flex flex-col items-center pt-6 text-center">
    <ProfileAvatar :profile="profile" />

    <ProfileBadge :profile="profile" />

    <ProfileMiniStats />
  </div>
</template>
