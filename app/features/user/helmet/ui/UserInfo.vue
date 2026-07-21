<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { useProfileBadges } from '~profile/activation/composables';

  const props = defineProps<{
    user: UserProfile;
  }>();

  const emit = defineEmits<{
    'open-profile': [];
  }>();

  // Отображаемое имя вместо логина; фолбэк — логин.
  const displayName = computed(
    () => props.user.displayName || props.user.username,
  );

  // Данные бейджей прогреваются заранее в хелмете (см. UserHelmet), поэтому к
  // моменту открытия панели корона и рамка уже готовы — без «доезда».
  const { hasAvatarFrame, isSubscriptionActive, frameImageUrl } =
    useProfileBadges();

  // Клик по аватару открывает профиль; меню закрывает родитель (там состояние поповера).
  function openProfile() {
    emit('open-profile');
  }
</script>

<template>
  <div class="flex min-h-20 items-center gap-3 p-4">
    <div class="flex min-w-0 flex-1 flex-col">
      <div
        class="mb-1 overflow-hidden text-2xl font-semibold text-ellipsis whitespace-nowrap"
      >
        {{ displayName }}
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <UBadge
          color="primary"
          variant="subtle"
          size="md"
        >
          Авантюрист
        </UBadge>

        <!-- Бейдж активной подписки — только корона, подпись в тултипе -->
        <UTooltip
          v-if="isSubscriptionActive"
          text="Подписка активна"
        >
          <UBadge
            color="success"
            variant="subtle"
            size="md"
            icon="tabler:crown"
          />
        </UTooltip>
      </div>
    </div>

    <div
      class="relative shrink-0 cursor-pointer"
      @click.left.exact.prevent="openProfile"
    >
      <UAvatar
        :alt="displayName"
        size="3xl"
        :ui="{ fallback: 'uppercase' }"
      />

      <!-- Рамка аватара (перк AVATAR_FRAME из кода) — оверлей поверх аватара -->
      <img
        v-if="hasAvatarFrame"
        :src="frameImageUrl"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-10 h-full w-full scale-[1.35] object-contain"
      />
    </div>
  </div>
</template>
