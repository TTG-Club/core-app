<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { ProfileGeneral } from '~profile/general';

  defineProps<{
    profile?: UserProfile;
  }>();
</script>

<template>
  <ProfileGeneral :profile="profile" />
</template>
