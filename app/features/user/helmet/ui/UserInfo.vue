<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  import { useMyRewards } from '~profile/activation/composables';
  import { AVATAR_FRAME_IMAGE_URL } from '~profile/activation/model';

  defineProps<{
    user: UserProfile;
  }>();

  const emit = defineEmits<{
    'open-profile': [];
  }>();

  const { hasPerk } = useMyRewards();

  // Рамка аватара — косметический перк AVATAR_FRAME, выданный кодом.
  const hasAvatarFrame = computed(() => hasPerk('AVATAR_FRAME'));

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
        {{ user.username }}
      </div>

      <div
        class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-secondary"
      >
        {{ user.email }}
      </div>
    </div>

    <div
      class="relative shrink-0 cursor-pointer"
      @click.left.exact.prevent="openProfile"
    >
      <UAvatar
        :alt="user.username"
        size="3xl"
        :ui="{ fallback: 'uppercase' }"
      />

      <!-- Рамка аватара (перк AVATAR_FRAME из кода) — оверлей поверх аватара -->
      <img
        v-if="hasAvatarFrame"
        :src="AVATAR_FRAME_IMAGE_URL"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-10 h-full w-full scale-[1.35] object-contain"
      />
    </div>
  </div>
</template>
