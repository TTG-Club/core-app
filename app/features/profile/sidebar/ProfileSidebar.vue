<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { useSubscriptionAutoRefresh } from '~profile/activation/composables';

  import { ProfileAvatar, ProfileBadge, ProfileMiniStats } from './ui';

  defineProps<{
    profile?: UserProfile;
  }>();

  // Держим статус подписки/перки актуальными без F5 (таймер + возврат на вкладку).
  // Один вызов на весь раздел профиля — сайдбар присутствует на всех его страницах.
  useSubscriptionAutoRefresh();
</script>

<template>
  <div class="relative flex flex-col items-center pt-6 text-center">
    <ProfileAvatar :profile="profile" />

    <ProfileBadge :profile="profile" />

    <ProfileMiniStats />
  </div>
</template>
