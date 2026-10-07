<script setup lang="ts">
  import {
    EmailVerificationCard,
    PasswordChangeCard,
    TwoFactorCard,
  } from './ui';
</script>

<template>
  <div class="space-y-6">
    <EmailVerificationCard />

    <PasswordChangeCard />

    <TwoFactorCard />
  </div>
</template>
