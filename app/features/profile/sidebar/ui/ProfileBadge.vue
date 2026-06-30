<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import {
    useMyRewards,
    useMySubscriptions,
  } from '~profile/activation/composables';

  defineProps<{
    profile?: UserProfile;
  }>();

  const { subscriptions } = useMySubscriptions();
  const { hasPerk } = useMyRewards();

  // Бейдж активной подписки — если есть хотя бы одна подписка в статусе ACTIVE.
  const isSubscriptionActive = computed(() =>
    (subscriptions.value ?? []).some((sub) => sub.status === 'ACTIVE'),
  );

  // Косметические перки, применяемые к профилю (выдаются кодом).
  const hasProfileBadge = computed(() => hasPerk('PROFILE_BADGE'));
  const hasNicknameColor = computed(() => hasPerk('NICKNAME_COLOR'));
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-center gap-2">
      <!-- Значок профиля (перк PROFILE_BADGE) — слева от имени -->
      <UIcon
        v-if="hasProfileBadge"
        name="tabler:rosette-discount-check-filled"
        class="size-7 shrink-0 text-warning"
        aria-hidden="true"
      />

      <!-- Имя; при перке NICKNAME_COLOR — выделяем градиентом -->
      <h2
        class="text-3xl font-bold tracking-tight"
        :class="
          hasNicknameColor
            ? 'bg-linear-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent'
            : 'text-primary'
        "
      >
        {{ profile?.username || 'Путешественник' }}
      </h2>
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-center gap-2">
      <UBadge
        color="primary"
        variant="subtle"
        size="md"
      >
        Авантюрист
      </UBadge>

      <!-- Бейдж активной подписки -->
      <UBadge
        v-if="isSubscriptionActive"
        color="success"
        variant="subtle"
        size="md"
        icon="tabler:crown"
      >
        Подписка активна
      </UBadge>
    </div>
  </div>
</template>
