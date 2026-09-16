<script setup lang="ts">
  import { useEmailVerification } from '../composables';
  import {
    EMAIL_VERIFICATION_CARD_TITLE,
    EMAIL_VERIFICATION_PENDING_DESCRIPTION,
    EMAIL_VERIFICATION_PENDING_TITLE,
    EMAIL_VERIFICATION_RESEND_COOLDOWN_PREFIX,
    EMAIL_VERIFICATION_RESEND_HINT,
    EMAIL_VERIFICATION_RESEND_LABEL,
    EMAIL_VERIFICATION_VERIFIED_DESCRIPTION,
    EMAIL_VERIFICATION_VERIFIED_TITLE,
    ProfileCardUI,
  } from '../model';

  const { isEmailVerified, isLoading, isCoolingDown, remainingLabel, resend } =
    useEmailVerification();

  const alertColor = computed(() =>
    isEmailVerified.value ? 'success' : 'warning',
  );

  const alertIcon = computed(() =>
    isEmailVerified.value ? 'tabler:mail-check' : 'tabler:mail-exclamation',
  );

  const alertTitle = computed(() =>
    isEmailVerified.value
      ? EMAIL_VERIFICATION_VERIFIED_TITLE
      : EMAIL_VERIFICATION_PENDING_TITLE,
  );

  const alertDescription = computed(() =>
    isEmailVerified.value
      ? EMAIL_VERIFICATION_VERIFIED_DESCRIPTION
      : EMAIL_VERIFICATION_PENDING_DESCRIPTION,
  );

  const resendLabel = computed(() =>
    isCoolingDown.value
      ? `${EMAIL_VERIFICATION_RESEND_COOLDOWN_PREFIX} ${remainingLabel.value}`
      : EMAIL_VERIFICATION_RESEND_LABEL,
  );
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:mail"
          class="h-5 w-5 text-primary"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">
          {{ EMAIL_VERIFICATION_CARD_TITLE }}
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        :icon="alertIcon"
        :color="alertColor"
        variant="subtle"
        :title="alertTitle"
        :description="alertDescription"
      />

      <div
        v-if="!isEmailVerified"
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <span class="text-sm text-muted">
          {{ EMAIL_VERIFICATION_RESEND_HINT }}
        </span>

        <UButton
          icon="tabler:mail-forward"
          color="primary"
          class="shrink-0"
          :loading="isLoading"
          :disabled="isLoading || isCoolingDown"
          @click.left.exact.prevent="resend"
        >
          {{ resendLabel }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>
